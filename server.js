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
const functions = require("./functions");
const map = require("./maps");
const { CoinsGenerator } = require("./spawn");
const { LobbyTimer, GameTimer } = require("./time");

// Zmienne 
const PORT = 4000; // Port
const rooms = {}; // Pokoje

// Tworzenie aplikacji
app.use(express.static(
    path.join(__dirname, "/")
));
map.initMaps();
map.loadTiles();

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
        socket.on("start-game", function(data) {
            startGame(data.gameCode);
        });
        // Poruszanie gracza
        socket.on("update-player", function (data) {
            updatePlayer(data);
        });
        socket.on("update-coins", function (data) {
            deleteCoin(data);
        });
        socket.on("defeat-player", function (data) {
            defeatPlayer(data.playerId, data.gameCode, data.playerCode);
        });
        sendData(socket);
    });
    socket.on("check-room", function(data) {
        checkRoom(data, socket);
    });
});

// Uruchamianie programu na odpowiednim porcie
server.listen(PORT, function () {
});

// Funkcja dołączająca gracza do gry
function connectPlayer(socket, data) {
    var admin = false;
    var gameCode = data.code;
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
        isAdmin: admin
    });

    // Przypisywanie graczowi podstawowych danych
    socket.playerCode = data.playerCode // Kod gracza (ciąg cyfr)
    socket.playerNick = data.nick; // Nick
    socket.skin = data.choosenSkin; // Index skina
    socket.gameCode = gameCode; // Kod gry

    // Dodawanie gracza do pokoju
    rooms[gameCode].players.push({
        playerCode: data.playerCode,
        nick: data.nick,
        gameCode: gameCode,
        admin,
        
        xPos: 0,
        yPos: 0,
        direction: 0,
        
        role: ROLE_INNOCENT,
        moving: false,
        movingIndex: -1,
        skin: socket.skin,
        shots: [],
    });
    rooms[gameCode].sockets.push(socket);

    rooms[gameCode].lobbyTimer.changePlayers(rooms[gameCode].players.length);
    sendPlayersNumber(gameCode);
}

// Funkcja odłączająca gracza z gry
function disconnectPlayer(socket) {
    var playerCode = socket.playerCode;
    var gameCode = socket.gameCode;
    
    var index = functions.findPlayerIndex(rooms[gameCode].players, playerCode);
    const admin = rooms[gameCode].players[index];
    const deletedAdmin = admin ? admin.admin : false;

    if(!rooms[gameCode].players[index].dead) {
        defeatPlayer(playerCode, gameCode, null);
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
    if(deletedAdmin) {
        rooms[gameCode].players[0].admin = true;
        rooms[gameCode].sockets[0].emit("get-admin", rooms[gameCode].players.length);
    }
}

function startGame(gameCode) {
    const room = rooms[gameCode];
    room.gameStarted = true;
    room.coinsGen.startGen();
    room.gameTimer.startTimer();
    room.lobbyTimer.stopTimer();

    const randPositions = createRandPositions(room);
    createRoles(room);

    for(var i = 0; i < room.players.length; i++) {
        room.sockets[i].emit("start-game", {
            coins: room.coinsGen.mapCoins,
            role: room.players[i].role,

            xPos: randPositions[i].randX,
            yPos: randPositions[i].randY
        });
    }
    sendInnocents(gameCode);
}
function stopGame(gameCode) {
    rooms[gameCode].gameTimer.stopTimer();
}

function createRandPositions(room) {
    const mapObj = map.mapsObjs[room.map];
    const spawnPositions = Array.from(mapObj.spawn);
    const randPositions = [];
    
    for(var i = 0; i < room.players.length; i++) {
        const randPos = functions.getRandom(0, spawnPositions.length - 1);
        const randX = spawnPositions[randPos][0];
        const randY = spawnPositions[randPos][1];

        randPositions[i] = {randX, randY};
        spawnPositions.splice(randPos, 1);
    }
    return randPositions;
}
function createRoles(room) {
    var murdererIndex = functions.getRandom(0, room.players.length - 1);
    room.players[murdererIndex].role = ROLE_MURDERER;
    room.players[murdererIndex].kills = 0;

    var detectiveIndex = functions.getRandom(0, room.players.length - 1);
    if(detectiveIndex == murdererIndex) {
        detectiveIndex++;
        if(detectiveIndex >= room.players.length) detectiveIndex = 0;
    }
    room.players[detectiveIndex].role = ROLE_DETECTIVE;
}

// Funkcja poruszająca gracza
function updatePlayer(data) {
    var player = findPlayerInRoom(data.gameCode, data.playerCode);

    // Zmiana danych gracza związanych z ruchem
    player.xPos = data.xPos;
    player.yPos = data.yPos;
    player.direction = data.direction;
    player.moving = data.moving;
    player.movingIndex = data.movingIndex;
    player.shots = data.shots;

    player.shooting = data.shooting;
    player.shootingDirIndex = data.shootingDirIndex;
    player.leftButton = data.leftButton;
    player.charged = data.charged;

    player.swordAttack = data.swordAttack;
    player.swordAttackStage = data.swordAttackStage;
    player.swordDirIndex = data.swordDirIndex;
}

// Funkcja wysyłająca dane innych graczy
function sendData(socket) {
    setInterval(function () {
        for (var name in rooms) {
            var room = rooms[name];
            socket.to(name).emit("send-data", {
                players: room.players,
                deadTextures: room.deadTextures
            });
        }
    }, 15);
}
function sendCoins(mapCoins, gameCode) {
    var socketsArray = rooms[gameCode].sockets;
    for (var socket of socketsArray) {
        socket.emit("update-coins", { mapCoins });
    }
}
function deleteCoin(data) {
    var gameCode = data.gameCode;
    var gen = rooms[gameCode].coinsGen;

    gen.destroyCoin(data.coinIndex);
    sendCoins(gen.mapCoins, gameCode);
}

function defeatPlayer(playerCode, gameCode, murdererCode) {
    var room = rooms[gameCode];

    if(murdererCode && murdererCode != null) {
        const murderer = findPlayerInRoom(gameCode, murdererCode);
        if(murderer.role == ROLE_MURDERER) murderer.kills++;
        else {
        }
    }

    var playerIndex = functions.findPlayerIndex(room.players, playerCode);
    var defeatedPlayer = room.players[playerIndex];
    defeatedPlayer.dead = true;

    room.deadTextures.push({
        index: defeatedPlayer.skin,
        xPos: defeatedPlayer.xPos,
        yPos: defeatedPlayer.yPos
    });

    var socket = room.sockets[playerIndex];
    socket.emit("defeat-player");

    var murdererVictory = true;
    for(var player of room.players) {
        if(player.role != ROLE_MURDERER && !player.dead) {
            murdererVictory = false;
            break;
        }
    }

    const murdererObj = findMurderer(gameCode);
    const detectiveObj = findDetective(gameCode);

    if(murdererObj && murdererObj.dead) {
        stopGame(gameCode);
    }
    if(detectiveObj && detectiveObj.dead) {
        for(var playerSocket of room.sockets) {
            playerSocket.emit("defeat-detective");
        }
    }

    if(murdererVictory) {
        stopGame(gameCode);
    }
    sendInnocents(gameCode);
}

function findMurderer(gameCode) {
    return rooms[gameCode].players.find(function(player){
        return player.role == ROLE_MURDERER;
    });
}
function findDetective(gameCode) {
    return rooms[gameCode].players.find(function(player){
        return player.role == ROLE_DETECTIVE;
    });
}

function sendInnocents(gameCode) {
    const room = rooms[gameCode];
    const playersArray = room.players;

    var playersNumber = 0;
    for(var player of playersArray) {
        if(player.role == ROLE_INNOCENT && !player.dead) {
            playersNumber++;
        }
    }
    for(var playerSocket of room.sockets) {
        playerSocket.emit("players-number-game", playersNumber);
    }
}

// Funkcja tworząca nowy pokój
function createRoom(gameCode) {
    var mapIndex = functions.getRandom(0, map.MAPS - 1);
    rooms[gameCode] = {
        players: [],
        sockets: [],
        map: mapIndex,
        gameStarted: false,
        deadTextures: [],

        coinsGen: new CoinsGenerator(map.mapsObjs[mapIndex].spawn, gameCode, sendCoins),
        lobbyTimer: new LobbyTimer(gameCode, sendLobbyTime, startGame),
        gameTimer: new GameTimer(gameCode, sendGameTime, stopGame)
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
    socket.emit("check-room", {playersNumber, isGameStarted});
}

function sendLobbyTime(gameCode, timeString) {
    for(var socket of rooms[gameCode].sockets) {
        socket.emit("lobby-time", {timeString});
    }
}
function sendGameTime(gameCode, timeString) {
    for(var socket of rooms[gameCode].sockets) {
        socket.emit("game-time", {timeString});
    }
}

function sendPlayersNumber(gameCode) {
    for (var playerSocket of rooms[gameCode].sockets) {
        playerSocket.emit("players-number-lobby", rooms[gameCode].players.length);
    }
}

function findPlayerInRoom(gameCode, playerCode) {
    var room = rooms[gameCode];
    var index = functions.findPlayerIndex(room.players, playerCode);
    return room.players[index];
}