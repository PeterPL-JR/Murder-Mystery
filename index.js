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

server.listen(PORT, function() {
});