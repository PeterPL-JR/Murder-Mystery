var gameContainer = document.getElementById("game-container"); // Elementy strony z grą
var loginContainer = document.getElementById("login-container"); // Interfejs dołączania do gry

// Zmienne związane z elementem <canvas>
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var time = 0;
var anims = [];

var nick; // Nick gracza
var playerCode; // Kod gracza

var socket; // Gniazdo Socket.io
var gameCode; // Kod gry

const TILE_SIZE = 96; // Wielkość pojedynczego kafelka
const MAP_SIZE = 40; // Wielkość mapy
const _TILES = 24; // Ilość rodzajów kafelków

const SCREEN_MAP_WIDTH = 13;
const SCREEN_MAP_HEIGHT = 7;

// Wielkość obiektu <canvas>
const WIDTH = SCREEN_MAP_WIDTH * TILE_SIZE;
const HEIGHT = SCREEN_MAP_HEIGHT * TILE_SIZE;

// Tablica [x][y] z kafelkami
var tiles = [];

var tilesObjs = []; // Obiekty kafelków
var tilesSolid = []; // Wartości "solid"
var tilesNames = [];

const tilesImages = []; // Obrazki kafelków
const keys = {}; // Klawisze (true/false)
var anim1;

// Funkcja rozpoczynająca grę
function joinGame(data) {
    anim1 = new Anim("coin.png", 0, 0, 64, 64, 9);

    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    socket = data.socket;
    nick = data.nick;
    playerCode = data.playerCode;
    skinIndex = data.choosenSkin;
    gameCode = data.code;

    socket.on("send-data", function (data) {
        otherPlayers = data;
    });
    socket.on("send-tiles", function (data) {
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

    initKeyboard();
    initMouse();
}

// Funkcja ładowania obrazków
function loadImages() {
    // Ładowanie kafelków
    for (var obj of tilesObjs) {
        tilesImages.push(createImage("tiles/" + obj.file));
        tilesSolid.push(obj.solid);
        tilesNames.push(obj.file.substring(0, obj.file.length - 4));
    }
    // Ładowanie tektur gracza
    for (var i = 0; i < _SKINS; i++) {
        skinsImages[i] = createImage("players/player" + (i + 1) + ".png");
    }

    shootingTextures1 = [
        [1, 3], [0, 3]
    ];
    shootingTextures2 = [
        [3, 3], [2, 3]
    ];
}

// Funkcja tworząca tablicę z kafelkami
function initTiles(tilesData) {
    for (var y = 0; y < MAP_SIZE; y++) {
        for (var x = 0; x < MAP_SIZE; x++) {
            var tileType = tilesData[y][x];
            tiles.push({
                xPos: x,
                yPos: y,
                type: tileType
            });
        }
    }
}

// Funkcja renderująca
function draw() {
    requestAnimationFrame(draw);
    charged = fireRateTime >= FIRE_RATE;

    if (keys["F"]) shooting = keys["F"];
    else shooting = false;

    for(var anim of anims) {
        anim.update();
    }

    // Czyszczenie ekranu
    ctx.fillStyle = "#121212";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    renderTiles();

    renderPlayers();
    renderShots();

    anim1.render();

    // Renderowanie Nicku
    drawNick(nick, WIDTH / 2, Y_OFFSET - 18);

    // Renderowanie Gracza
    drawPlayer(X_OFFSET, Y_OFFSET, skinIndex, direction, movingIndex, shooting, shootingIndex, leftButton, charged);

    // Poruszanie się gracza
    if (!shooting) {
        playerMoving();
    }
    time++;

    if(time % 5 == 0 && fireRateTime < FIRE_RATE) {
        fireRateTime++;
    }
}

// Funkcja renderująca kafelki
function renderTiles() {
    for (var tile of tiles) {
        var tileX = tile.xPos * TILE_SIZE - playerX + X_OFFSET;
        var tileY = tile.yPos * TILE_SIZE - playerY + Y_OFFSET;
        ctx.drawImage(tilesImages[tile.type], tileX, tileY);
    }
}

// Funkcja ładująca pojedynczy obrazek
function createImage(path) {
    var image = document.createElement("img");
    image.src = "images/" + path;
    return image;
}

function drawRotatedImage(image, x, y, width, height, angle) {
    var translateX = x + width / 2;
    var translateY = y + height / 2;

    ctx.translate(translateX, translateY);
    ctx.rotate(angle);
    ctx.drawImage(image, -width / 2, -height / 2, width, height);

    ctx.rotate(-angle);
    ctx.translate(-translateX, -translateY);
}

function getTile(tileX, tileY) {
    var tile = tiles.find(function (tile) {
        var condX = tileX >= tile.xPos * TILE_SIZE && tileX < tile.xPos * TILE_SIZE + TILE_SIZE;
        var condY = tileY >= tile.yPos * TILE_SIZE && tileY < tile.yPos * TILE_SIZE + TILE_SIZE;
        return condX && condY;
    });
    return tile;
}
class Anim {
    constructor(path, x, y, width, height, frameTime) {
        this.path = path;
        
        this.width = width;
        this.height = height;
        
        this.xPos = x;
        this.yPos = y;

        this.frame = 0;
        this.startTime = time;
        this.frameTime = frameTime;
        this.init();
    }
    
    init() {
        this.image = createImage(this.path);
        this.maxFrames = this.image.width / this.width;
        anims.push(this);
    }
    update() {
        if((time - this.startTime) % this.frameTime == 0) {
            this.frame++;
            if(this.frame >= this.maxFrames) {
                this.frame = 0;
            }
        }
    }
    render() {
        ctx.drawImage(this.image, this.frame * this.width, 0, this.width, this.height, this.xPos, this.yPos, this.width, this.height);
    }
}