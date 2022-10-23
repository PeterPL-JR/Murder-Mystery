// Tworzenie Servera
const express = require("express");
const app = express();
const http = require("http");
const path = require("path");

const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// Eksportowanie modułów
const functions = require("./functions");
const map = require("./maps");
const { CoinsGenerator } = require("./spawn");

// Zmienne 
const PORT = 4000; // Port
const rooms = {}; // Pokoje

// Tworzenie aplikacji
app.use(express.static(
    path.join(__dirname, "/")
));
map.initMaps();
map.loadTiles();

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
            defeatPlayer(data);
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

        moving: false,
        movingIndex: -1,
        skin: socket.skin,
        shots: [],
    });
    rooms[gameCode].sockets.push(socket);
    sendPlayersNumber(gameCode);
}

// Funkcja odłączająca gracza z gry
function disconnectPlayer(socket) {
    var playerCode = socket.playerCode;
    var gameCode = socket.gameCode;

    var index = functions.findPlayerIndex(rooms[gameCode].players, playerCode);
    const deletedAdmin = rooms[gameCode].players[index].admin;
    
    rooms[gameCode].players.splice(index, 1);
    rooms[gameCode].sockets.splice(index, 1);
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
    rooms[gameCode].gameStarted = true;
    rooms[gameCode].coinsGen.startGen();
    for(var socket of rooms[gameCode].sockets) {
        socket.emit("start-game", {coins: rooms[gameCode].coinsGen.mapCoins});
    }
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
            socket.to(name).emit("send-data", room.players);
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

function defeatPlayer(data) {
    var playerCode = data.playerId;
    var gameCode = data.gameCode;
    var room = rooms[gameCode];

    var playerIndex = functions.findPlayerIndex(room.players, playerCode);
    var defeatedPlayer = room.players[playerIndex];
    defeatedPlayer.dead = true;

    defeatedPlayer.dieX = defeatedPlayer.xPos;
    defeatedPlayer.dieY = defeatedPlayer.yPos;

    var socket = rooms[gameCode].sockets[playerIndex];
    socket.emit("defeat-player");
}

// Funkcja tworząca nowy pokój
function createRoom(gameCode) {
    var mapIndex = functions.getRandom(0, map.MAPS - 1);
    rooms[gameCode] = {
        players: [],
        sockets: [],
        map: mapIndex,
        gameStarted: false,
        coinsGen: new CoinsGenerator(map.mapsObjs[mapIndex].spawn, gameCode, sendCoins)
    };
}

function deleteRoom(gameCode) {
    rooms[gameCode].coinsGen.destroy();
    delete rooms[gameCode];
}

function checkRoom(data, socket) {
    const room = rooms[data.code];
    const playersNumber = (room) ? room.players.length : 0;

    const isGameStarted = room == undefined ? false : room.gameStarted;
    socket.emit("check-room", {playersNumber, isGameStarted});
}

function sendPlayersNumber(gameCode) {
    for (var playerSocket of rooms[gameCode].sockets) {
        playerSocket.emit("players-number", rooms[gameCode].players.length);
    }
}

function findPlayerInRoom(gameCode, playerCode) {
    var room = rooms[gameCode];
    var index = functions.findPlayerIndex(room.players, playerCode);
    return room.players[index];
}