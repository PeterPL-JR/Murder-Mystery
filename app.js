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
const TEX_SPEED = SPEED * 4;

// Wielkość mapy (wyrażona w kafelkach)
const MAP_WIDTH = WIDTH / TILE_SIZE;
const MAP_HEIGHT = HEIGHT / TILE_SIZE;

// Offsety (renderowanie gracza na środku planszy)
const xOffset = WIDTH / 2 - TILE_SIZE / 2;
const yOffset = HEIGHT / 2 - TILE_SIZE / 2;

// Tablica [x][y] z kafelkami
var tiles = [];

// Współrzędne gracza
var playerX = 0;
var playerY = 0;

// Ruch gracza
var direction = 0;
var moving = false;
var movingTime = 0;

// Aktualna textura gracza
var playerImg = createImage("player.png");

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
    // Ładowanie kafelków
    for(var i = 0; i < tilesNames.length; i++) {
        tilesImages[i] = createImage(tilesNames[i] + ".png");
    }

    // Ładowanie tektur gracza
    for(var dir of dirs) {
        textures.push(createImage("player/" + dir + ".png"));
        movingTextures1.push(createImage("player/" + dir + "_go1.png"));
        movingTextures2.push(createImage("player/" + dir + "_go2.png"));
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

// Funkcja poruszania się
function move(x, y) {
    playerX += x * SPEED;
    playerY += y * SPEED;
    playerImg = textures[direction];
    moving = true;
}

// Funkcja renderująca
function draw() {
    requestAnimationFrame(draw);
    moving = false;

    // Czyszczenie ekranu
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

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
            var moveX = playerMove[0];
            var moveY = playerMove[1];
            direction = movingKeys.indexOf(keyOfObj);
            move(moveX, moveY);
        }
    }
    setTexture();

    if(moving) {
        movingTime++;
    } else {
        movingTime = 0;
    }
}

// Funkcja ustawiająca teksturę
function setTexture() {
    if(moving) {
        playerImg = (movingTime % TEX_SPEED < TEX_SPEED / 2) ? movingTextures1[direction] : movingTextures2[direction];
    } else {
        playerImg = textures[direction];
    }
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