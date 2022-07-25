// Tworzenie Servera
const express = require("express");
const app = express();
const http = require("http");
const path = require("path");

const server = http.createServer(app);
const {Server} = require("socket.io");
const io = new Server(server);

// Zmienne 
const PORT = 4000; // Port
const rooms = {};

// Tworzenie aplikacji
app.use(express.static(
    path.join(__dirname, "/")
));

// Kod dziejący się po uruchomieniu strony
io.on("connection", function(socket) {
    // Dołączenie gracza do gry
    socket.on("join-game", function(data) {
        var gameCode = data.code;
        socket.join(gameCode);

        if(Object.keys(rooms).indexOf(gameCode) == -1) {
            rooms[gameCode] = [];
        }

        socket.playerCode = data.playerCode
        socket.playerNick = data.nick;
        socket.skin = data.choosenSkin;
        socket.gameCode = gameCode;

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
    });
    // Wyjście gracza z gry
    socket.on("disconnect", function() {
        var playerCode = socket.playerCode;
        var gameCode = socket.gameCode;

        var index = findPlayerIndex(rooms[gameCode], playerCode);
        rooms[gameCode].splice(index, 1);

        if(rooms[gameCode].length == 0) {
            delete rooms[gameCode];
        }
    });

    socket.on("player-moved", function(data) {
        var gameCode = data.gameCode;
        var room = rooms[gameCode];
        var index = findPlayerIndex(room, data.playerCode);

        room[index].xPos = data.xPos;
        room[index].yPos = data.yPos;
        room[index].direction = data.direction;
        room[index].moving = data.moving;
        room[index].movingIndex = data.movingIndex;
    });
    setInterval(function() {
        for(var name in rooms) {
            var room = rooms[name];
            socket.to(name).emit("send-players", room);
        }
    }, 15);
});

// Uruchamianie programu na odpowiednim porcie
server.listen(PORT, function() {
});

// Funkcja wyszukująca gracza w tablicy na podstawie jego kodu
function findPlayerIndex(room, code) {
    return room.findIndex(function(obj) {
        return obj.playerCode == code;
    });
}
function findPlayer(room, code) {
    return room.find(function(obj) {
        return obj.playerCode == code;
    });
}