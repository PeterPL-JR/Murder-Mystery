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

// Zmienne 
const PORT = 4000; // Port
const rooms = {}; // Pokoje
const maps = {}; // Mapy

// Tworzenie aplikacji
app.use(express.static(
    path.join(__dirname, "/")
));
map.initMaps();
map.loadTiles();

// Kod dziejący się po uruchomieniu strony
io.on("connection", function(socket) {

    // Dołączanie gracza do grt
    socket.on("join-game", function(data) {
        connectPlayer(socket, data);
    });
    // Wychodzenie gracza z gry
    socket.on("disconnect", function() {
        disconnectPlayer(socket);
    });
    // Poruszanie gracza
    socket.on("player-moved", function(data) {
        movePlayer(data);
    });
    sendPlayers(socket);
});

// Uruchamianie programu na odpowiednim porcie
server.listen(PORT, function() {
});

// Funkcja dołączająca gracza do gry
function connectPlayer(socket, data) {
    var gameCode = data.code;
    socket.join(gameCode);

    // Tworzenie pokoju, jeżeli nie istnieje
    if(Object.keys(rooms).indexOf(gameCode) == -1) {
        createRoom(gameCode);
    }

    // Wysyłania klientowi mapy i danych kafelków
    socket.emit("send-tiles", map.tiles);
    socket.on("send-map", function() {
        socket.emit("send-map", map.mapsObjs[maps[gameCode]]);
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

        xPos: 0, 
        yPos: 0,
        direction: 0,
        
        moving: false,
        movingIndex: -1,
        skin: socket.skin
    });
}

// Funkcja odłączająca gracza z gry
function disconnectPlayer(socket) {
    var playerCode = socket.playerCode;
    var gameCode = socket.gameCode;
    
    var index = functions.findPlayerIndex(rooms[gameCode], playerCode);
    rooms[gameCode].splice(index, 1);
    
    // Usuwanie pokoju, jeżeli jest pusty
    if(rooms[gameCode].length == 0) {
        delete rooms[gameCode];
    }
}

// Funkcja poruszająca gracza
function movePlayer(data) {
    var gameCode = data.gameCode;
    var room = rooms[gameCode];
    var index = functions.findPlayerIndex(room, data.playerCode);

    // Zmiana danych gracza związanych z ruchem
    room[index].xPos = data.xPos;
    room[index].yPos = data.yPos;
    room[index].direction = data.direction;
    room[index].moving = data.moving;
    room[index].movingIndex = data.movingIndex;
}

// Funkcja wysyłająca dane innych graczy
function sendPlayers(socket) {
    setInterval(function() {
        for(var name in rooms) {
            var room = rooms[name];
            socket.to(name).emit("send-players", room);
        }
    }, 15);
}

// Funkcja tworząca nowy pokój
function createRoom(gameCode) {
    var mapIndex = functions.getRandom(0, map.MAPS - 1);
    rooms[gameCode] = [];
    maps[gameCode] = mapIndex;
}