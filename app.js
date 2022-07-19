var gameContainer = document.getElementById("game-container"); // Elementy strony z grą
var loginContainer = document.getElementById("login-container"); // Interfejs dołączania do gry

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
const SPEED = 8;
const TEX_SPEED = SPEED * 4;

// Wielkość mapy (wyrażona w kafelkach)
const MAP_WIDTH = WIDTH / TILE_SIZE;
const MAP_HEIGHT = HEIGHT / TILE_SIZE;

// Offsety (renderowanie gracza na środku planszy)
const xOffset = WIDTH / 2 - TILE_SIZE / 2;
const yOffset = HEIGHT / 2 - TILE_SIZE / 2;

// Tablica [x][y] z kafelkami
var tiles = [];

// Tablica innych graczy
var otherPlayers = [];

// Dane gracza
var playerX = 0;
var playerY = 0;
var nick;

// Ruch gracza
var direction = 3;
var moving = false;
var movingTime = 0;
var movingIndex = -1;

// Aktualna textura gracza
var playerImg;

// Rodzaje używanych kafelków
const tilesNames = [
    "grass", "wall"
];
// Tablica z obrazkami kafelków
const tilesImages = [];
const keys = {};

// Tablica kierunków
const dirs = [
    "up", "down", "left", "right"
];

// Klawisze
const movingKeys = [
    "W", "S", "A", "D"
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

    socket.on("send-players", function (data) {
        otherPlayers = data;
    });

    document.body.style.backgroundColor = "#121212"; // Zmiana koloru tła
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

    // Przygotuj grę
    loadImages();
    initTiles();

    // Rozpocznij grę!
    draw();
}

// Funkcja ładowania obrazków
function loadImages() {
    // Ładowanie kafelków
    for (var i = 0; i < tilesNames.length; i++) {
        tilesImages[i] = createImage(tilesNames[i] + ".png");
    }

    // Ładowanie tektur gracza
    for (var dir of dirs) {
        textures.push(createImage("player/" + dir + ".png"));
        movingTextures1.push(createImage("player/" + dir + "_go1.png"));
        movingTextures2.push(createImage("player/" + dir + "_go2.png"));
    }
    playerImg = textures[direction];
}

// Funkcja tworząca tablicę z kafelkami
function initTiles() {
    for (var x = 0; x < MAP_WIDTH; x++) {
        tiles[x] = [];
        for (var y = 0; y < MAP_HEIGHT; y++) {
            var tileType = getRandom(0, 1);
            tiles[x][y] = {
                xPos: x - 4,
                yPos: y - 3,
                type: tileType
            };
        }
    }
}

// Funkcja poruszania się
function move(x, y) {
    playerX += x * SPEED;
    playerY += y * SPEED;
    playerImg = textures[direction];
    moving = true;
    send();
}

// Funkcja renderująca
function draw() {
    requestAnimationFrame(draw);

    // Czyszczenie ekranu
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    renderTiles();
    renderPlayers();

    // Renderowanie Gracza
    ctx.drawImage(playerImg, xOffset, yOffset);

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
    setTexture();

    if (moving) {
        movingTime++;
        movingIndex = movingTime % TEX_SPEED < TEX_SPEED / 2;
    }
}

// Funkcja renderująca graczy
function renderPlayers() {
    for (var player of otherPlayers) {
        if (player.playerCode == playerCode) continue;

        var xPos = player.xPos - playerX + xOffset;
        var yPos = player.yPos - playerY + yOffset;
        var dir = player.direction;

        var playerTex;
        if (player.moving) {
            playerTex = (player.movingIndex) ? movingTextures1[dir] : movingTextures2[dir];
        } else {
            playerTex = textures[dir];
        }
        ctx.drawImage(playerTex, xPos, yPos);
    }
}

// Funkcja renderująca kafelki
function renderTiles() {
    for (var x = 0; x < MAP_WIDTH; x++) {
        for (var y = 0; y < MAP_HEIGHT; y++) {
            const tile = tiles[x][y];

            var tileX = tile.xPos * TILE_SIZE - playerX + xOffset;
            var tileY = tile.yPos * TILE_SIZE - playerY + yOffset;
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
        moving, movingIndex
    });
}

// Funkcja ustawiająca teksturę
function setTexture() {
    if (moving) {
        playerImg = (movingIndex) ? movingTextures1[direction] : movingTextures2[direction];
    } else {
        playerImg = textures[direction];
    }
}