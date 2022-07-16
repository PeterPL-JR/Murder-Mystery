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
 
// Tworzenie aplikacji
app.use(express.static(
    path.join(__dirname, "/")
));

// Kod dziejący się po uruchomieniu strony
io.on("connection", function(socket) {
    // Dołączenie gracza do gry
    socket.on("join-game", function(data) {
        socket.playerNick = data.nick;
        console.log("Gracz " + data.nick + " dolaczuyl do gry!");
    });
    // Wyjście gracza z gry
    socket.on("disconnect", function() {
        console.log("Niestety gracz " + socket.playerNick + "wyszedl z gry :(");
    });
});

// Uruchamianie programu na odpowiednim porcie
server.listen(PORT, function() {
});