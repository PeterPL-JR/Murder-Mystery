const PLAYER_SIZE = 160; // Wielkość obrazku gracza
const SPEED = 9; // Szybkość gracza
const TEX_SPEED = SPEED * 4; // Szybkość zmiany tekstury chodzenia

// Położenie x, y gracza na mapie
var playerX = MAP_SIZE * TILE_SIZE / 2 - PLAYER_SIZE / 2 - TILE_SIZE / 2;
var playerY = MAP_SIZE * TILE_SIZE / 2 - PLAYER_SIZE / 2 + TILE_SIZE / 2;

// Położenie x, y gracza na obiekcie <canvas>
const X_OFFSET = WIDTH / 2 - PLAYER_SIZE / 2;
const Y_OFFSET = HEIGHT / 2 - PLAYER_SIZE / 2;

// Ruch gracza
var direction = 0;
var moving = false;
var shooting = false;
var leftButton = false;
var shootingIndex = -1;

var movingTime = 0;
var movingIndex = -1;

var coins = 0;

const _SKINS = 13; // Ilość postaci
var skinIndex = 0; // Index skina gracza

var skinsImages = []; // Obrazki postaci
var otherPlayers = []; // Tablica innych graczy
var shots = [];

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

var shootingTextures1 = [];
var shootingTextures2 = [];

// Funkcja renderująca graczy
function renderPlayers() {
    for (var player of otherPlayers) {
        if (player.playerCode == playerCode) continue;

        var xPos = getX(player.xPos);
        var yPos = getY(player.yPos);
        drawPlayer(xPos, yPos, player.skin, player.direction, player.movingIndex, player.shooting, player.shootingIndex, player.leftButton, player.charged);
        
        var textX = xPos + PLAYER_SIZE / 2;
        var textY = yPos - 18;
        drawNick(player.nick, textX, textY);

        for(var shot of player.shots) {
            drawShot(getX(shot.xPos), getY(shot.yPos), shot.angle);
        }
    }
}

// Funkcja wysyłająca do serwera dane gracza
function send() {
    socket.emit("update-player", {
        xPos: playerX,
        yPos: playerY,
        playerCode, direction,
        moving, movingIndex,

        shooting, shootingIndex,
        leftButton, charged,
        gameCode, shots
    });
}

// Funkcja poruszająca gracza w zależności od naciśniętego klawisza
function playerMoving() {
    for (var keyOfObj in keys) {
        var playerMove = allTheRightMoves[keyOfObj];

        // Poruszaj, gry klawisz jest naciśnięty oraz jest to W,S,D lub D
        if (keys[keyOfObj] && playerMove) {
            // Poruszaj gracza
            var moveX = playerMove[0];
            var moveY = playerMove[1];
            direction = movingKeys.indexOf(keyOfObj);

            if(!isCollision(playerX, playerY, moveX, moveY, direction)) {
                move(moveX, moveY);
            }
            send();
        }
    }
    if (moving) {
        movingTime++;
        movingIndex = (movingTime % TEX_SPEED < TEX_SPEED / 2) ? 0 : 1;
    }
}

// Funkcja renderująca dowolnego gracza na mapie
function drawPlayer(x, y, textureIndex, direction, movingIndex, shooting, shootingIndex, leftButton, charged) {
    var texture = skinsImages[textureIndex];
    var xOffset = direction;
    var yOffset = movingIndex + 1;

    if(shooting) {
        var shootingTextures = shootingIndex == 1 ? shootingTextures1 : shootingTextures2;
        var index = leftButton ? 0 : 1;
        if(!charged) index = 1;

        xOffset = shootingTextures[index][0];
        yOffset = shootingTextures[index][1];
    }
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

function shoot(mouseX, mouseY) {
    var playerCenterX = playerX + PLAYER_SIZE / 2;
    var playerCenterY = playerY + PLAYER_SIZE / 2;

    var xPos = mouseX + playerX - X_OFFSET;
    var yPos = mouseY + playerY - Y_OFFSET;

    var xLength = xPos - playerCenterX;
    var yLength = yPos - playerCenterY;

    var angle = Math.atan2(yLength, xLength);
    var shot = new ArrowShot(playerCenterX, playerCenterY, angle);
    shots.push(shot);
    send();
}

function pickCoin(index) {
    coins++;
    destroyCoin(index);
}

function checkCoinCollision(playerX, playerY) {
    var index = mapCoins.findIndex(function(coin) {
        if(coin == null) return false;
        var condX = playerX > coin.xPos + COIN_SIZE || playerX + PLAYER_SIZE < coin.xPos;
        var condY = playerY > coin.yPos + COIN_SIZE || playerY + PLAYER_SIZE < coin.yPos;
        return !(condX || condY);
    });
    if(index != -1) {
        pickCoin(index);
    }
}

function getX(mapX) {
    return mapX - playerX + X_OFFSET;
}
function getY(mapY) {
    return mapY - playerY + Y_OFFSET;
}