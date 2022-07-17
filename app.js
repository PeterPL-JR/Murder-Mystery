var gameContainer = document.getElementById("game-container"); // Elementy strony z grą
var loginContainer = document.getElementById("login-container"); // Interfejs dołączania do gry

// Zmienne obiektu <canvas>
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

// Wielkość obiektu <canvas> (wyrażona w pikselach)
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Wielkość pojedynczego kafelka (wyrażona w pikselach)
const TILE_SIZE = 96;
const SPEED = 8;

// Wielkość mapy (wyrażona w kafelkach)
const MAP_WIDTH = WIDTH / TILE_SIZE;
const MAP_HEIGHT = HEIGHT / TILE_SIZE;

// Tablica [x][y] z kafelkami
var tiles = [];

// Współrzędne gracza
var playerX = 0;
var playerY = 0;

var playerImg = createImage("player.png");

// Rodzaje używanych kafelków
const tilesNames = [
    "grass", "wall"
];
// Tablica z obrazkami kafelków
const tilesImages = [];
const keys = {};

const allTheRightMoves = {
    W: [0, -1],
    S: [0, 1],
    A: [-1, 0],
    D: [1, 0]
};

function joinGame() {
    document.body.style.backgroundColor = "#121212"; // Zmiana koloru tła

    gameContainer.style.display = "inline-block"; // Pokazanie obiektu <canvas>
    loginContainer.style.display = "none"; // Ukrycie interfejsu logowania

    // Wykrywanie, kiedy klawisz został kliknięty
    document.body.onkeydown = function(event) {
        keys[event.key.toUpperCase()] = true;
    }
    // Wykrywanie, kiedy klawisz został puszczony
    document.body.onkeyup = function(event) {
        keys[event.key.toUpperCase()] = false;
    }

    // Przygotuj grę
    loadImages();
    initTiles();

    // Rozpocznij grę!
    draw();
}

// Funkcja ładowania obrazków
function loadImages() {
    for(var i = 0; i < tilesNames.length; i++) {
        tilesImages[i] = createImage(tilesNames[i] + ".png");
    }
}

// Funkcja tworząca tablicę z kafelkami
function initTiles() {
    for(var x = 0; x < MAP_WIDTH; x++) {
        tiles[x] = [];
        for(var y = 0; y < MAP_HEIGHT; y++) {
            var tileType = getRandom(0, 1);
            tiles[x][y] = {
                xPos: x - 4,
                yPos: y - 3,
                type: tileType
            };
        }
    }
}

function draw() {
    requestAnimationFrame(draw);

    // Czyszczenie ekranu
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Offsety (renderowanie gracza na środku planszy)
    var xOffset = WIDTH / 2 - TILE_SIZE / 2;
    var yOffset = HEIGHT / 2 - TILE_SIZE / 2;

    // Renderowanie Kafelków
    for(var x = 0; x < MAP_WIDTH; x++) {
        for(var y = 0; y < MAP_HEIGHT; y++) {
            const tile = tiles[x][y];

            var tileX = tile.xPos * TILE_SIZE - playerX + xOffset;
            var tileY = tile.yPos * TILE_SIZE - playerY + yOffset;
            ctx.drawImage(tilesImages[tile.type], tileX, tileY);
        }
    }
    // Renderowanie Gracza
    ctx.drawImage(playerImg, xOffset, yOffset);

    // Poruszanie się gracza
    for(var keyOfObj in keys) {
        var playerMove = allTheRightMoves[keyOfObj];
        // Poruszaj, gry klawisz jest naciśnięty oraz jest to W,S,D lub D
        if(keys[keyOfObj] && playerMove) {
            // Poruszaj gracza
            playerX += playerMove[0] * SPEED;
            playerY += playerMove[1] * SPEED;
        }
    }

    console.log(playerX, playerY);
}

// Funkcja ładująca pojedynczy obrazek
function createImage(path) {
    var image = document.createElement("img");
    image.src = "images/" + path;
    return image;
}

// Funkcja zwracająca losową liczbę z przedziału od MIN do MAX włącznie
function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}