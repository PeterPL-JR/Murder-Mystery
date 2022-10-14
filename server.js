// Tworzenie Servera
const express = require("express");
const app = express();
const http = require("http");
const path = require("path");

const server = http.createServer(app);
const {Server} = require("socket.io");
const io = new Server(server);

// Eksportowanie modułów
const functions = require("./functions");
const map = require("./maps");
const {CoinsGenerator} = require("./spawn");

// Zmienne 
const PORT = 4000; // Port
const rooms = {}; // Pokoje
const maps = {}; // Mapy

const sockets = {};
const coinsGen = {};

// Tworzenie aplikacji
app.use(express.static(
    path.join(__dirname, "/")
));
map.initMaps();
map.loadTiles();

// Kod dziejący się po uruchomieniu strony
io.on("connection", function(socket) {

    // Dołączanie gracza do gry
    socket.on("join-game", function(data) {
        connectPlayer(socket, data);
    });
    // Wychodzenie gracza z gry
    socket.on("disconnect", function() {
        disconnectPlayer(socket);
    });
    // Poruszanie gracza
    socket.on("update-player", function(data) {
        updatePlayer(data);
    });
    socket.on("update-coins", function(data) {
        deleteCoin(data);
    });
    socket.on("defeat-player", function(data) {
        defeatPlayer(data);
    });
    sendData(socket);
});

// Uruchamianie programu na odpowiednim porcie
server.listen(PORT, function() {
});

// Funkcja dołączająca gracza do gry
function connectPlayer(socket, data) {
    var admin = false;
    var gameCode = data.code;
    socket.join(gameCode);

    // Tworzenie pokoju, jeżeli nie istnieje
    if(Object.keys(rooms).indexOf(gameCode) == -1) {
        admin = true;
        createRoom(gameCode);
    }

    // Wysyłania klientowi mapy i danych kafelków
    socket.emit("send-begin-data", {
        tiles: map.tiles,
        map:  map.mapsObjs[maps[gameCode]],
        coins: coinsGen[gameCode].mapCoins,
        isAdmin: admin
    });

    // Przypisywanie graczowi podstawowych danych
    socket.playerCode = data.playerCode // Kod gracza (ciąg cyfr)
    socket.playerNick = data.nick; // Nick
    socket.skin = data.choosenSkin; // Index skina
    socket.gameCode = gameCode; // Kod gry

    // Dodawanie gracza do pokoju
    rooms[gameCode].push({
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
    sockets[gameCode].push(socket);
    sendPlayersNumber(gameCode);
}

// Funkcja odłączająca gracza z gry
function disconnectPlayer(socket) {
    var playerCode = socket.playerCode;
    var gameCode = socket.gameCode;
    
    var index = functions.findPlayerIndex(rooms[gameCode], playerCode);
    rooms[gameCode].splice(index, 1);
    sendPlayersNumber(gameCode);
    
    // Usuwanie pokoju, jeżeli jest pusty
    if(rooms[gameCode].length == 0) {
        deleteRoom(gameCode);
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
    setInterval(function() {
        for(var name in rooms) {
            var room = rooms[name];
            socket.to(name).emit("send-data", room);
        }
    }, 15);
}
function sendCoins(mapCoins, gameCode) {
    var socketsArray = sockets[gameCode];
    for(var socket of socketsArray) {
        socket.emit("update-coins", {mapCoins});
    }
}
function deleteCoin(data) {
    var gameCode = data.gameCode;
    var gen = coinsGen[gameCode]; 

    gen.destroyCoin(data.coinIndex);
    sendCoins(gen.mapCoins, gameCode);
}

function defeatPlayer(data) {
    var playerCode = data.playerId;
    var gameCode = data.gameCode;
    var room = rooms[gameCode];

    var playerIndex = functions.findPlayerIndex(room, playerCode);
    var defeatedPlayer = room[playerIndex];
    defeatedPlayer.dead = true;
    
    defeatedPlayer.dieX = defeatedPlayer.xPos;
    defeatedPlayer.dieY = defeatedPlayer.yPos;

    var socket = sockets[gameCode][playerIndex];
    socket.emit("defeat-player");
}

// Funkcja tworząca nowy pokój
function createRoom(gameCode) {
    var mapIndex = functions.getRandom(0, map.MAPS - 1);
    rooms[gameCode] = [];
    sockets[gameCode] = [];
    maps[gameCode] = mapIndex;
    coinsGen[gameCode] = new CoinsGenerator(map.mapsObjs[mapIndex].spawn, gameCode, sendCoins);
}

function deleteRoom(gameCode) {
    delete rooms[gameCode];
    delete maps[gameCode];
    delete sockets[gameCode];

    coinsGen[gameCode].destroy();
    delete coinsGen[gameCode];
}

function sendPlayersNumber(gameCode) {
    for(var playerSocket of sockets[gameCode]) {
        playerSocket.emit("players-number", rooms[gameCode].length);
    }
}

function findPlayerInRoom(gameCode, playerCode) {
    var room = rooms[gameCode];
    var index = functions.findPlayerIndex(room, playerCode);
    return room[index];
}