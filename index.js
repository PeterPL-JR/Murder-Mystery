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
const players = [];

// Tworzenie aplikacji
app.use(express.static(
    path.join(__dirname, "/")
));

// Kod dziejący się po uruchomieniu strony
io.on("connection", function(socket) {
    // Dołączenie gracza do gry
    socket.on("join-game", function(data) {
        socket.playerCode = data.playerCode
        socket.playerNick = data.nick;
        socket.gameCode = data.code;

        players.push({
            playerCode: data.playerCode,
            nick: data.nick,
            gameCode: data.code,
            xPos: 0,
            yPos: 0,
            direction: 3,
            moving: false,
            movingIndex: -1
        });

        console.log("Gracz " + data.nick + " dolaczyl do gry!");
    });
    // Wyjście gracza z gry
    socket.on("disconnect", function() {
        var playerCode = socket.playerCode;
        var index = findPlayerIndex(playerCode);
        players.splice(index, 1);
        console.log("Niestety gracz " + playerCode + " wyszedl z gry :(");
    });

    socket.on("player-moved", function(data) {
        var index = findPlayerIndex(data.playerCode);
        players[index].xPos = data.xPos;
        players[index].yPos = data.yPos;
        players[index].direction = data.direction;
        players[index].moving = data.moving;
        players[index].movingIndex = data.movingIndex;
    });
    setInterval(function() {
        socket.emit("send-players", players);
    }, 15);
});

// Uruchamianie programu na odpowiednim porcie
server.listen(PORT, function() {
});

// Funkcja wyszukująca gracza w tablicy na podstawie jego kodu
function findPlayerIndex(code) {
    return players.findIndex(function(obj) {
        return obj.playerCode == code;
    });
}
function findPlayer(code) {
    return players.find(function(obj) {
        return obj.playerCode == code;
    });
}