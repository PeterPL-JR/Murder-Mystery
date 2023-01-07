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
var isAdmin;
var gameStarted = false;

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

// Funkcja rozpoczynająca grę
function joinGame(data) {
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    initHitboxes();
    initBoards();

    socket = data.socket;
    nick = data.nick;
    playerCode = data.playerCode;
    skinIndex = data.choosenSkin;
    gameCode = data.code;

    socket.on("send-data", function (data) {
        otherPlayers = data.players;
        deadTextures = data.deadTextures;
    });
    socket.on("send-begin-data", function(data) {
        tilesObjs = data.tiles;
        initTiles(data.map.data); // Przygotuj kafelki
        spawnPositions = data.spawn;

        lobbyBoard.setString("map-name", data.map.name);
        lobbyBoard.setString("game-code", gameCode);
        gameBoard.setString("map-name", data.map.name);

        loadImages(); // Przygotuj grę
        draw(); // Rozpocznij grę!
        isAdmin = data.isAdmin;
    });
    socket.on("update-coins", function (data) {
        createMapCoins(data.mapCoins);
    });
    socket.on("defeat-player", function() {
        dead = true;
        role = ROLE_DEAD;

        gameBoard.setString("role", ROLES_NAMES[ROLE_DEAD]);
        gameBoard.setColor("role", ROLES_COLORS[ROLE_DEAD]);
    });
    socket.on("defeat-detective", function() {
    });
    socket.on("players-number-lobby", function(data) {
        if(isAdmin) {
            getAdmin(data);
        }
        lobbyBoard.setString("players", data + "/" + _MAX_PLAYERS);
    });
    socket.on("players-number-game", function(data) {
        gameBoard.setString("innocents", data);
    });
    socket.on("get-admin", function(data) {
        isAdmin = true;
        getAdmin(data);
    });
    socket.on("start-game", function(data) {
        startGame(data);
    });
    socket.on("lobby-time", function(data) {
        lobbyBoard.setString("time-left", data.timeString);
    });
    socket.on("game-time", function(data) {
        gameBoard.setString("time-left", data.timeString);
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
        tilesImages.push(new ImgAsset("tiles/" + obj.file, TILE_SIZE, TILE_SIZE));

        tilesSolid.push(obj.solid);
        tilesNames.push(obj.file.substring(0, obj.file.length - 4));
    }

    const PLAYER_IMG_WIDTH = 4;
    const PLAYER_IMG_HEIGHT = 5;

    const GHOST_IMG_WIDTH = 4;
    const GHOST_IMG_HEIGHT = 3;

    const PLAYER_IMG_SIZE = 16;

    // Ładowanie tektur gracza
    for (var i = 0; i < _SKINS; i++) {
        skinsImages[i] = [];
        ghostsImages[i] = [];

        const playerImage = createImage("players/player" + (i + 1) + ".png");
        const ghostImage = createImage("ghosts/player" + (i + 1) + ".png");

        for(let x = 0; x < PLAYER_IMG_WIDTH; x++) {
            skinsImages[i][x] = [];
            for(let y = 0; y < PLAYER_IMG_HEIGHT; y++) {
                const sx = PLAYER_IMG_SIZE * x;
                const sy = PLAYER_IMG_SIZE * y;
                skinsImages[i][x][y] = new ImgAsset(playerImage, PLAYER_SIZE, PLAYER_SIZE, sx, sy, PLAYER_IMG_SIZE, PLAYER_IMG_SIZE);
            }
        }
        for(let x = 0; x < GHOST_IMG_WIDTH; x++) {
            ghostsImages[i][x] = [];
            for(let y = 0; y < GHOST_IMG_HEIGHT; y++) {
                const sx = PLAYER_IMG_SIZE * x;
                const sy = PLAYER_IMG_SIZE * y;
                ghostsImages[i][x][y] = new ImgAsset(ghostImage, PLAYER_SIZE, PLAYER_SIZE, sx, sy, PLAYER_IMG_SIZE, PLAYER_IMG_SIZE);
            }
        }
    }

    weaponTextures = {
        left: [1, 0],
        right: [3, 2]
    };
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

    if(!isPlayerReady()) {
        shooting = false;
    }

    // Czyszczenie ekranu
    ctx.fillStyle = "#121212";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    renderTiles();

    for(var anim of anims) {
        anim.update();
        anim.render();
    }

    renderPlayers();
    renderShots();

    // Renderowanie Nicku
    drawNick(nick, WIDTH / 2, Y_OFFSET - 18);

    // Renderowanie Gracza
    drawPlayer(X_OFFSET, Y_OFFSET, skinIndex, direction, movingIndex, shooting, shootingDirIndex, leftButton, charged, swordAttack, swordDirIndex, swordAttackStage, dead);
    
    if(!dead) {
        checkCoinCollision(playerX, playerY);
    }

    // Poruszanie się gracza
    if (!shooting && !swordAttack) {
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
        var tileX = getX(tile.xPos * TILE_SIZE);
        var tileY = getY(tile.yPos * TILE_SIZE);
        tilesImages[tile.type].draw(tileX, tileY);
    }
}

function getTile(tileX, tileY) {
    var tile = tiles.find(function (tile) {
        var condX = tileX >= tile.xPos * TILE_SIZE && tileX < tile.xPos * TILE_SIZE + TILE_SIZE;
        var condY = tileY >= tile.yPos * TILE_SIZE && tileY < tile.yPos * TILE_SIZE + TILE_SIZE;
        return condX && condY;
    });
    return tile;
}

function getRadians(deg) {
    return deg * Math.PI / 180;
}
function getDegrees(rad) {
    return rad * 180 / Math.PI;
}