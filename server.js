// Tworzenie Servera
const express = require("express");
const app = express();
const http = require("http");
const path = require("path");

const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// Ilość graczy maksymalna
const _MAX_PLAYERS = 12;
exports._MAX_PLAYERS = _MAX_PLAYERS;

// Eksportowanie modułów
const functions = require("./server/functions");
const map = require("./server/maps");
const spawn = require("./server/spawn");

const { CoinsGenerator } = require("./server/spawn");
const { LobbyTimer, GameTimer } = require("./server/time");

// Zmienne 
const PORT = 4000; // Port
const rooms = {}; // Pokoje
exports.rooms = rooms;

// Tworzenie aplikacji
app.use(express.static(
    path.join(__dirname, "/client")
));
map.initMaps();
map.loadTiles();
spawn.loadHitboxes();

const ROLE_INNOCENT = 0;
const ROLE_MURDERER = 1;
const ROLE_DETECTIVE = 2;

// Kod dziejący się po uruchomieniu strony
io.on("connection", function (socket) {

    // Dołączanie gracza do gry
    socket.on("join-game", function (data) {
        connectPlayer(socket, data);

        // Wychodzenie gracza z gry
        socket.on("disconnect", function () {
            disconnectPlayer(socket);
        });
        socket.on("start-game", function (data) {
            startGame(data.gameCode);
        });
        setEvents(socket);
        sendData(socket);
    });
    socket.on("check-room", function (data) {
        checkRoom(data, socket);
    });
});

// Uruchamianie programu na odpowiednim porcie
server.listen(PORT, function () {
});

function setEvents(socket) {
    // Poruszanie gracza
    socket.on("update-player", function (data) {
        updatePlayer(data);
    });
    socket.on("update-coins", function (data) {
        spawn.deleteCoin(data);
    });
    socket.on("defeat-player", function (data) {
        defeatPlayer(data.defeatedCode, data.gameCode, data.murdererCode);
    });
    socket.on("take-detective-bow", function(data) {
        takeDetectiveBow(data.gameCode, data.playerCode);
    });
}

// Funkcja dołączająca gracza do gry
function connectPlayer(socket, data) {
    let admin = false;
    let gameCode = data.code;
    socket.join(gameCode);

    // Tworzenie pokoju, jeżeli nie istnieje
    if (Object.keys(rooms).indexOf(gameCode) == -1) {
        admin = true;
        createRoom(gameCode);
    }

    // Wysyłania klientowi mapy i danych kafelków
    socket.emit("send-begin-data", {
        tiles: map.tiles,
        map: map.mapsObjs[rooms[gameCode].map],
        hitboxes: spawn.hitboxes,
        isAdmin: admin
    });

    // Przypisywanie graczowi podstawowych danych
    const playerCode = socket.playerCode = data.playerCode
    const playerNick = socket.playerNick = data.nick;
    const skin = socket.skin = data.choosenSkin;
    socket.gameCode = gameCode;

    // Dodawanie gracza do pokoju
    const playerObject = {
        player: { /*Dane Gracza*/
            playerCode: playerCode, // Kod gracza (ciąg cyfr)
            nick: playerNick, // Nick gracza
            gameCode: gameCode, // Kod gry
            role: ROLE_INNOCENT, // Rola gracza
            skinIndex: skin, // Index skina
            admin: admin, // Czy gracz jest adminem?

            x: 0, // pozycja x
            y: 0, // pozycja y
            direction: 0, // Kierunek ruchu
            moving: false, // Czy gracz się porusza?
            movingIndex: -1 // Index tekstury ruchu
        },
        bow: { /*Dane łuku*/
            shots: [] // Tablica strzał
        },
        sword: {} /*Dane miecza*/
    };
    rooms[gameCode].players.push(playerObject);
    rooms[gameCode].sockets.push(socket);

    rooms[gameCode].lobbyTimer.changePlayers(rooms[gameCode].players.length);
    sendPlayersNumber(gameCode);
}

// Funkcja odłączająca gracza z gry
function disconnectPlayer(socket) {
    let playerCode = socket.playerCode;
    let gameCode = socket.gameCode;

    let index = functions.findPlayerIndex(rooms[gameCode].players, playerCode);
    const admin = rooms[gameCode].players[index];
    const deletedAdmin = admin ? admin.player.admin : false;

    if (rooms[gameCode].gameStarted && !rooms[gameCode].players[index].player.dead) {
        defeatPlayer(playerCode, gameCode, null);
    }
    if(rooms[gameCode].players.length == 0) {
        index = 0;
    }

    rooms[gameCode].players.splice(index, 1);
    rooms[gameCode].sockets.splice(index, 1);

    rooms[gameCode].lobbyTimer.changePlayers(rooms[gameCode].players.length);
    sendPlayersNumber(gameCode);

    // Usuwanie pokoju, jeżeli jest pusty
    if (rooms[gameCode].players.length == 0) {
        deleteRoom(gameCode);
        return;
    }
    if (deletedAdmin) {
        rooms[gameCode].players[0].player.admin = true;
        rooms[gameCode].sockets[0].emit("get-admin", rooms[gameCode].players.length);
    }
}

function startGame(gameCode) {
    const room = rooms[gameCode];
    room.gameStarted = true;
    room.coinsGen.startGen();
    room.gameTimer.startTimer();
    room.lobbyTimer.stopTimer();

    const randPositions = map.createRandPositions(room);
    createRoles(room);

    for (let i = 0; i < room.players.length; i++) {
        room.sockets[i].emit("start-game", {
            coins: room.coinsGen.mapCoins,
            role: room.players[i].player.role,

            xPos: randPositions[i].randX,
            yPos: randPositions[i].randY
        });
    }
    sendInnocents(gameCode);
}
function stopGame(gameCode) {
    rooms[gameCode].gameTimer.stopTimer();
}

function createRoles(room) {
    let murdererIndex = functions.getRandom(0, room.players.length - 1);
    room.players[murdererIndex].player.role = ROLE_MURDERER;
    room.players[murdererIndex].player.kills = 0;

    let detectiveIndex = functions.getRandom(0, room.players.length - 1);
    if (detectiveIndex == murdererIndex) {
        detectiveIndex++;
        if (detectiveIndex >= room.players.length) detectiveIndex = 0;
    }
    room.players[detectiveIndex].player.role = ROLE_DETECTIVE;
    room.detectiveBowPlayer = detectiveIndex;
}

// Funkcja poruszająca gracza
function updatePlayer(data) {
    let player = functions.findPlayerInRoom(rooms[data.player.gameCode], data.player.playerCode);

    // Zmiana danych gracza związanych z ruchem
    player.player.x = data.player.x;
    player.player.y = data.player.y;
    player.player.direction = data.player.direction;
    player.player.moving = data.player.moving;
    player.player.movingIndex = data.player.movingIndex;

    player.bow = data.bow;
    player.sword = data.sword;
}

// Funkcja wysyłająca dane innych graczy
function sendData(socket) {
    setInterval(function () {
        for (let name in rooms) {
            let room = rooms[name];
            socket.to(name).emit("send-data", {
                players: room.players,
                deadTextures: room.deadTextures
            });
        }
    }, 15);
}

function defeatPlayer(defeatedCode, gameCode, murdererCode) {
    let room = rooms[gameCode];

    let defeatedPlayerIndex = functions.findPlayerIndex(room.players, defeatedCode);
    let defeatedPlayer = room.players[defeatedPlayerIndex];
    defeatedPlayer.player.dead = true;

    if(defeatedPlayerIndex == room.detectiveBowPlayer) {
        dropDetectiveBow(room, defeatedPlayer);
    }

    if (murdererCode && murdererCode != null) {
        const murderer = functions.findPlayerInRoom(room, murdererCode);
        if (murderer.player.role == ROLE_MURDERER) murderer.player.kills++;
        else {
            if(defeatedPlayer.player.role != ROLE_MURDERER) {
                defeatPlayer(murdererCode, gameCode, null);
            }
        }
    }

    room.deadTextures.push({
        index: defeatedPlayer.player.skinIndex,
        xPos: defeatedPlayer.player.x,
        yPos: defeatedPlayer.player.y
    });

    let socket = room.sockets[defeatedPlayerIndex];
    socket.emit("defeat-player");

    let murdererVictory = true;
    for (let player of room.players) {
        if (player.player.role != ROLE_MURDERER && !player.player.dead) {
            murdererVictory = false;
            break;
        }
    }

    const murdererObj = findMurderer(gameCode);
    if (murdererObj && murdererObj.player.dead) {
        stopGame(gameCode);
    }

    if (murdererVictory) {
        stopGame(gameCode);
    }
    sendInnocents(gameCode);
}

function takeDetectiveBow(gameCode, playerCode) {
    const room = rooms[gameCode];
    if(room.detectiveBowPlayer != null) {
        return;
    }
    const playerIndex = functions.findPlayerIndex(room.players, playerCode);

    room.detectiveBowPlayer = playerIndex;
    for (let playerSocket of room.sockets) {
        playerSocket.emit("take-detective-bow");
    }
}

function dropDetectiveBow(room, defeatedPlayer) {
    const xPos = defeatedPlayer.player.x;
    const yPos = defeatedPlayer.player.y;

    room.detectiveBowPlayer = null;
    for (let playerSocket of room.sockets) {
        playerSocket.emit("drop-detective-bow", {xPos, yPos});
    }
}

function findMurderer(gameCode) {
    return rooms[gameCode].players.find(function (player) {
        return player.player.role == ROLE_MURDERER;
    });
}
function findDetective(gameCode) {
    return rooms[gameCode].players.find(function (player) {
        return player.player.role == ROLE_DETECTIVE;
    });
}

function sendInnocents(gameCode) {
    const room = rooms[gameCode];
    const playersArray = room.players;

    let playersNumber = 0;
    for (let player of playersArray) {
        if (player.player.role == ROLE_INNOCENT && !player.player.dead) {
            playersNumber++;
        }
    }
    for (let playerSocket of room.sockets) {
        playerSocket.emit("players-number-game", playersNumber);
    }
}

// Funkcja tworząca nowy pokój
function createRoom(gameCode) {
    let mapIndex = functions.getRandom(0, map.MAPS - 1);
    rooms[gameCode] = {
        players: [],
        sockets: [],
        map: mapIndex,
        gameStarted: false,
        deadTextures: [],

        coinsGen: new CoinsGenerator(map.mapsObjs[mapIndex].spawn, gameCode, spawn.sendCoins),
        lobbyTimer: new LobbyTimer(gameCode, startGame),
        gameTimer: new GameTimer(gameCode, stopGame)
    };
    rooms[gameCode].lobbyTimer.startTimer();
}

function deleteRoom(gameCode) {
    rooms[gameCode].coinsGen.destroy();
    rooms[gameCode].lobbyTimer.stopTimer();
    rooms[gameCode].gameTimer.stopTimer();
    delete rooms[gameCode];
}

function checkRoom(data, socket) {
    const room = rooms[data.code];
    const playersNumber = (room) ? room.players.length : 0;

    const isGameStarted = room == undefined ? false : room.gameStarted;
    socket.emit("check-room", { playersNumber, isGameStarted });
}

function sendPlayersNumber(gameCode) {
    for (let playerSocket of rooms[gameCode].sockets) {
        playerSocket.emit("players-number-lobby", rooms[gameCode].players.length);
    }
}