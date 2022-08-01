const PLAYER_SIZE = 160; // Wielkość obrazku gracza
const SPEED = 8; // Szybkość gracza
const TEX_SPEED = SPEED * 4; // Szybkość zmiany tekstury chodzenia

// Położenie x, y gracza na mapie
var playerX = MAP_SIZE * TILE_SIZE / 2 - PLAYER_SIZE / 2;
var playerY = MAP_SIZE * TILE_SIZE / 2 - PLAYER_SIZE / 2;

// Położenie x, y gracza na obiekcie <canvas>
const X_OFFSET = WIDTH / 2 - PLAYER_SIZE / 2;
const Y_OFFSET = HEIGHT / 2 - PLAYER_SIZE / 2;

// Ruch gracza
var direction = 0;
var moving = false;

var movingTime = 0;
var movingIndex = -1;

const _SKINS = 13; // Ilość postaci
var skinIndex = 0; // Index skina gracza

var skinsImages = []; // Obrazki postaci
var otherPlayers = []; // Tablica innych graczy

// Tablica kierunków
const dirs = [
    "right", "left", "down", "up"
];

// Klawisze poruszania się
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

// Funkcja renderująca graczy
function renderPlayers() {
    for (var player of otherPlayers) {
        if (player.playerCode == playerCode) continue;

        var xPos = player.xPos - playerX + X_OFFSET;
        var yPos = player.yPos - playerY + Y_OFFSET;
        drawPlayer(xPos, yPos, player.skin, player.direction, player.movingIndex);
        
        var textX = xPos + PLAYER_SIZE / 2;
        var textY = yPos - 18;
        drawNick(player.nick, textX, textY);
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

// Funkcja renderująca dowolnego gracza na mapie
function drawPlayer(x, y, textureIndex, direction, movingIndex) {
    var texture = skinsImages[textureIndex];
    var xOffset = direction;
    var yOffset = movingIndex + 1;
    ctx.drawImage(texture, xOffset * PLAYER_SIZE, yOffset * PLAYER_SIZE, PLAYER_SIZE, PLAYER_SIZE, x, y, PLAYER_SIZE, PLAYER_SIZE);
}

// Funkcja renderująca nick gracza
function drawNick(nick, x, y) {
    ctx.font = "40px Verdana";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(nick, x, y);
}

// Funkcja poruszania się
function move(x, y) {
    playerX += x * SPEED;
    playerY += y * SPEED;
    moving = true;
}

function isCollision(playerX, playerY, moveX, moveY, direction) {
    var xPos = playerX + moveX;
    var yPos = playerY + moveY;

    if(direction == 0 || direction == 1) yPos += PLAYER_SIZE / 2;
    if(direction == 2 || direction == 3) xPos += PLAYER_SIZE / 2;

    if(direction == 0) xPos += 110;
    if(direction == 1) xPos += 60;
    if(direction == 2) yPos += 135;
    if(direction == 3) yPos += 90;

    var tile = getTile(xPos, yPos);
    return tilesSolid[tile.type];
}