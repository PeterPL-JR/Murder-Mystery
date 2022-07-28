var gameContainer = document.getElementById("game-container"); // Elementy strony z grą
var loginContainer = document.getElementById("login-container"); // Interfejs dołączania do gry

// Zmienne związane z elementem <canvas>
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var nick; // Nick gracza
var playerCode; // Kod gracza

var socket; // Gniazdo Socket.io
var gameCode; // Kod gry

// Wielkość obiektu <canvas>
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const TILE_SIZE = 96; // Wielkość pojedynczego kafelka
const MAP_SIZE = 40; // Wielkość mapy
const _TILES = 24; // Ilość rodzajów kafelków

// Tablica [x][y] z kafelkami
var tiles = [];

var tilesObjs = []; // Obiekty kafelków
var tilesSolid = []; // Wartości "solid"

const tilesImages = []; // Obrazki kafelków
const keys = {}; // Klawisze (true/false)

// Funkcja rozpoczynająca grę
function joinGame(data) {
    socket = data.socket;
    nick = data.nick;
    playerCode = data.playerCode;
    skinIndex = data.choosenSkin;
    gameCode = data.code;

    socket.on("send-players", function (data) {
        otherPlayers = data;
    });
    socket.on("send-tiles", function(data) {
        tilesObjs = data;
        socket.emit("send-map");
    });
    socket.on("send-map", function (data) {
        initTiles(data.data); // Przygotuj kafelki

        loadImages(); // Przygotuj grę
        draw(); // Rozpocznij grę!
    });

    gameContainer.style.display = "inline-block"; // Pokazanie obiektu <canvas>
    loginContainer.style.display = "none"; // Ukrycie interfejsu logowania

    // Wykrywanie, kiedy klawisz został kliknięty
    document.body.onkeydown = function (event) {
        keys[event.key.toUpperCase()] = true;
    }
    // Wykrywanie, kiedy klawisz został puszczony
    document.body.onkeyup = function (event) {
        var key = event.key.toUpperCase();
        keys[key] = false;
        if(movingKeys.indexOf(key) != -1) {
            moving = false;
            movingTime = 0;
            movingIndex = -1;
            send();
        }
    }
}

// Funkcja ładowania obrazków
function loadImages() {
    // Ładowanie kafelków
    for(var obj of tilesObjs) {
        tilesImages.push(createImage("tiles/" + obj.file));
        tilesSolid.push(obj.solid);
    }
    // Ładowanie tektur gracza
    for(var i = 0; i < _SKINS; i++) {
        skinsImages[i] = createImage("players/player" + (i + 1) + ".png");
    }
}

// Funkcja tworząca tablicę z kafelkami
function initTiles(tilesData) {
    for (var y = 0; y < MAP_SIZE; y++) {
        tiles[y] = [];
        for (var x = 0; x < MAP_SIZE; x++) {
            var tileType = tilesData[y][x];
            tiles[y][x] = {
                xPos: x,
                yPos: y,
                type: tileType
            };
        }
    }
}

// Funkcja renderująca
function draw() {
    requestAnimationFrame(draw);

    // Czyszczenie ekranu
    ctx.fillStyle = "#121212";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    renderTiles();
    renderPlayers();
    
    // Renderowanie Nicku
    drawNick(nick, WIDTH / 2, Y_OFFSET - 18);

    // Renderowanie Gracza
    drawPlayer(X_OFFSET, Y_OFFSET, skinIndex, direction, movingIndex);

    // Poruszanie się gracza
    for (var keyOfObj in keys) {
        var playerMove = allTheRightMoves[keyOfObj];

        // Poruszaj, gry klawisz jest naciśnięty oraz jest to W,S,D lub D
        if (keys[keyOfObj] && playerMove) {
            // Poruszaj gracza
            var moveX = playerMove[0];
            var moveY = playerMove[1];
            direction = movingKeys.indexOf(keyOfObj);
            move(moveX, moveY);
        }
    }
    if (moving) {
        movingTime++;
        movingIndex = (movingTime % TEX_SPEED < TEX_SPEED / 2) ? 0 : 1;
    }
}

// Funkcja renderująca kafelki
function renderTiles() {
    for (var x = 0; x < MAP_SIZE; x++) {
        for (var y = 0; y < MAP_SIZE; y++) {
            const tile = tiles[x][y];

            var tileX = tile.xPos * TILE_SIZE - playerX + X_OFFSET;
            var tileY = tile.yPos * TILE_SIZE - playerY + Y_OFFSET;
            ctx.drawImage(tilesImages[tile.type], tileX, tileY);
        }
    }
}

// Funkcja ładująca pojedynczy obrazek
function createImage(path) {
    var image = document.createElement("img");
    image.src = "images/" + path;
    return image;
}