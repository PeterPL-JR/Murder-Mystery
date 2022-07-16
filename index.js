// Tworzenie Servera
const express = require("express");
const app = express();
const http = require("http");
const path = require("path");

const server = http.createServer(app);
const {Server} = require("socket.io");
const io = new Server(server);

const PORT = 4000;

app.use(express.static(
    path.join(__dirname, "/")
));

io.on("connection", function(socket) {
    
    socket.on("join-game", function(data) {
        socket.playerNick = data.nick;
        console.log("Gracz " + data.nick + " dolaczuyl do gry!");
    });
    socket.on("disconnect", function() {
        console.log("Niestety gracz " + socket.playerNick + "wyszedl z gry :(");
    });
});

server.listen(PORT, function() {
});