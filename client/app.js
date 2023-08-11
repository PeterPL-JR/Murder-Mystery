let gameContainer = document.getElementById("game-container"); // Elementy strony z grą
let loginContainer = document.getElementById("login-container"); // Interfejs dołączania do gry

// Zmienne związane z elementem <canvas>
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let time = 0;
let anims = [];

let socket; // Gniazdo Socket.io
let gameCode; // Kod gry
let isAdmin;
let gameStarted = false;

const TILE_SIZE = 96; // Wielkość pojedynczego kafelka
const MAP_SIZE = 40; // Wielkość mapy
const _TILES = 24; // Ilość rodzajów kafelków

const SCREEN_MAP_WIDTH = 13;
const SCREEN_MAP_HEIGHT = 7;

// Wielkość obiektu <canvas>
const WIDTH = SCREEN_MAP_WIDTH * TILE_SIZE;
const HEIGHT = SCREEN_MAP_HEIGHT * TILE_SIZE;

// Tablica [x][y] z kafelkami
let tiles = [];

let tilesObjs = []; // Obiekty kafelków
let tilesSolid = []; // Wartości "solid"
let tilesNames = [];

const tilesImages = []; // Obrazki kafelków
const keys = {}; // Klawisze (true/false)

// Funkcja rozpoczynająca grę
function joinGame(data) {
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    initBoards();

    socket = data.socket;
    PLAYER.nick = data.nick;
    PLAYER.playerCode = data.playerCode;
    PLAYER.gameCode = data.code;
    PLAYER.skinIndex = data.choosenSkin;

    setInitEvents();
    setGameEvents();

    gameContainer.style.display = "inline-block"; // Pokazanie obiektu <canvas>
    loginContainer.style.display = "none"; // Ukrycie interfejsu logowania

    initKeyboard();
    initMouse();
}

function setInitEvents() {
    socket.on("send-begin-data", function(data) {
        tilesObjs = data.tiles;
        initTiles(data.map.data); // Przygotuj kafelki
        initHitboxes(data.hitboxes); // Przygotuj hitboxy
        spawnPositions = data.spawn;

        PLAYER.x = data.map.beginSpawn.x * TILE_SIZE - PLAYER_BEGIN_OFFSET_X;
        PLAYER.y = data.map.beginSpawn.y * TILE_SIZE - PLAYER_BEGIN_OFFSET_Y;

        lobbyBoard.setString("map-name", data.map.name);
        lobbyBoard.setString("game-code", PLAYER.gameCode);
        gameBoard.setString("map-name", data.map.name);

        loadImages(); // Przygotuj grę
        update(); // Rozpocznij grę!
        isAdmin = data.isAdmin;
    });
}

function setGameEvents() {
    socket.on("send-data", function (data) {
        otherPlayers = data.players;
        deadTextures = data.deadTextures;
    });
    socket.on("update-coins", function (data) {
        createMapCoins(data.mapCoins);
    });
    socket.on("defeat-player", function() {
        PLAYER.dead = true;
        PLAYER.role = ROLE_DEAD;

        gameBoard.setString("role", ROLES_NAMES[ROLE_DEAD]);
        gameBoard.setColor("role", ROLES_COLORS[ROLE_DEAD]);

        gameBoard.removeDiv("bow");
        gameBoard.div.querySelector("hr:last-child").remove();
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
    
    socket.on("detective-bow-taken", function() {
        takeDetectiveBow();
    });
    socket.on("detective-bow-dropped", function(data) {
        dropDetectiveBow(data.xPos, data.yPos);
    });
    socket.on("take-detective-bow", function() {
        getDetectiveBow();
    });
}

// Funkcja tworząca tablicę z kafelkami
function initTiles(tilesData) {
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            let tileType = tilesData[y][x];
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
    // Czyszczenie ekranu
    ctx.fillStyle = "#121212";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    renderTiles();

    for(let anim of anims) {
        anim.render();
    }
    drawDeadTextures();

    if(detectiveBow != null) {
        detectiveBow.render();
    }

    renderPlayers();
    renderShots();

    // Renderowanie Nicku
    drawNick(PLAYER.nick, WIDTH / 2, Y_OFFSET - 18, PLAYER_NICK_COLOR, PLAYER_OVERLAY_NICK_COLOR);

    // Renderowanie Gracza
    drawPlayer(X_OFFSET, Y_OFFSET, PLAYER, BOW, SWORD);

    if(compass != null && PLAYER.role == ROLE_INNOCENT) {
        compass.update(PLAYER.x, PLAYER.y);
        compass.render();
    }
}   

function update() {
    requestAnimationFrame(update);
    // Poruszanie się gracza
    if (!BOW.shooting && !SWORD.swordAttack) {
        playerMoving();
    }
    time++; // Aktualizowanie czasu gry

    // Strzelanie z łuku
    updateFireRate();

    if (keys["F"] && !PLAYER.dead && gameStarted) BOW.shooting = keys["F"];
    else BOW.shooting = false;

    if(!isPlayerReady()) {
        BOW.shooting = false;
    }

    // Sprawdzanie kolizji z monetami
    if(!PLAYER.dead && !isDetectiveBow) {
        checkCoinCollision(PLAYER.x, PLAYER.y);
    }
    if(!PLAYER.dead && PLAYER.role == ROLE_INNOCENT && detectiveBow != null) {
        checkBowCollision();
    }

    // Animacje
    for(let anim of anims) {
        anim.update();
    }
    if(detectiveBow != null) {
        detectiveBow.update();
    }
    
    if(displayTitle) {
        updateTitleScreen();
    }

    draw(); // Renderowanie gry
}

// Funkcja renderująca kafelki
function renderTiles() {
    for (let tile of tiles) {
        let tileX = getX(tile.xPos * TILE_SIZE);
        let tileY = getY(tile.yPos * TILE_SIZE);
        tilesImages[tile.type].draw(tileX, tileY);
    }
}

function getTile(tileX, tileY) {
    let tile = tiles.find(function (tile) {
        let condX = tileX >= tile.xPos * TILE_SIZE && tileX < tile.xPos * TILE_SIZE + TILE_SIZE;
        let condY = tileY >= tile.yPos * TILE_SIZE && tileY < tile.yPos * TILE_SIZE + TILE_SIZE;
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