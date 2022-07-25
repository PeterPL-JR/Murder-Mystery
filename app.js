var gameContainer = document.getElementById("game-container"); // Elementy strony z grą
var loginContainer = document.getElementById("login-container"); // Interfejs dołączania do gry

var skinsImages = [];
const _SKINS = 13;
const _TILES = 24;

// Zmienne do komunikacji z serwerem
var socket;
var playerCode;

// Zmienne obiektu <canvas>
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

// Wielkość obiektu <canvas> (wyrażona w pikselach)
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Wielkość pojedynczego kafelka (wyrażona w pikselach)
const TILE_SIZE = 96;
const PLAYER_SIZE = 160;
const SPEED = 8;
const TEX_SPEED = SPEED * 4;

// Wielkość mapy (wyrażona w kafelkach)
const MAP_SIZE = 40;

// Offsety (renderowanie gracza na środku planszy)
const X_OFFSET = WIDTH / 2 - PLAYER_SIZE / 2;
const Y_OFFSET = HEIGHT / 2 - PLAYER_SIZE / 2;

// Tablica [x][y] z kafelkami
var tiles = [];

// Tablica innych graczy
var otherPlayers = [];

// Dane gracza
var playerX = MAP_SIZE * TILE_SIZE / 2 - PLAYER_SIZE / 2;
var playerY = MAP_SIZE * TILE_SIZE / 2 - PLAYER_SIZE / 2;
var skinIndex = 0;

var nick;
var gameCode;

// Ruch gracza
var direction = 0;
var moving = false;
var movingTime = 0;
var movingIndex = -1;

// Tablica z obrazkami kafelków
const tilesImages = [];
const keys = {};

// Tablica kierunków
const dirs = [
    "right", "left", "down", "up"
];

// Klawisze
const movingKeys = [
    "D", "A", "S", "W"
];

// Klawisze i kierunki poruszania
const allTheRightMoves = {
    W: [0, -1],
    S: [0, 1],
    A: [-1, 0],
    D: [1, 0]
};

// Tablice tekstur
const textures = [];
const movingTextures1 = [];
const movingTextures2 = [];

function joinGame(data) {
    socket = data.socket;
    nick = data.nick;
    playerCode = data.playerCode;
    skinIndex = data.choosenSkin;
    gameCode = data.code;

    socket.on("send-players", function (data) {
        otherPlayers = data;
    });
    socket.on("send-map", function (data) {
        initTiles(data.data);

        // Przygotuj grę
        loadImages();

        // Rozpocznij grę!
        draw();
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
    for (var i = 0; i < _TILES; i++) {
        tilesImages[i] = createImage("tiles/tile" + (i + 1) + ".png");
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

// Funkcja poruszania się
function move(x, y) {
    playerX += x * SPEED;
    playerY += y * SPEED;
    moving = true;
    send();
}

// Funkcja renderująca
function draw() {
    requestAnimationFrame(draw);

    // Czyszczenie ekranu
    ctx.fillStyle = "#121212";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    renderTiles();
    renderPlayers();

    ctx.font = "40px Verdana";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(nick, WIDTH / 2, Y_OFFSET - 18);

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

// Funkcja renderująca graczy
function renderPlayers() {
    for (var player of otherPlayers) {
        if (player.playerCode == playerCode) continue;

        var xPos = player.xPos - playerX + X_OFFSET;
        var yPos = player.yPos - playerY + Y_OFFSET;
        drawPlayer(xPos, yPos, player.skin, player.direction, player.movingIndex);
        
        ctx.font = "40px Verdana";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";

        var textX = xPos + PLAYER_SIZE / 2;
        var textY = yPos - 18;
        ctx.fillText(player.nick, textX, textY);
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

// Funkcja wysyłająca do serwera dane gracza
function send() {
    socket.emit("player-moved", {
        xPos: playerX,
        yPos: playerY,
        playerCode, direction,
        moving, movingIndex,
        gameCode
    });
}

function drawPlayer(x, y, textureIndex, direction, movingIndex) {
    var texture = skinsImages[textureIndex];
    var xOffset = direction;
    var yOffset = movingIndex + 1;
    ctx.drawImage(texture, xOffset * PLAYER_SIZE, yOffset * PLAYER_SIZE, PLAYER_SIZE, PLAYER_SIZE, x, y, PLAYER_SIZE, PLAYER_SIZE);
}