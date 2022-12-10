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
var dead = false;
var role;

var movingTime = 0;
var movingIndex = -1;

const _SKINS = 13; // Ilość postaci
var skinIndex = 0; // Index skina gracza

var skinsImages = []; // Obrazki postaci
var ghostsImages = []; // Obrazki duchów
var otherPlayers = []; // Tablica innych graczy
var deadTextures = [];
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

// Funkcja renderująca graczy
function renderPlayers() {
    drawDeadTextures();
    
    for (var player of otherPlayers) {
        if (player.playerCode == playerCode) continue;
        if(player.dead && !dead) continue;

        var xPos = getX(player.xPos);
        var yPos = getY(player.yPos);
        drawPlayer(xPos, yPos, player.skin, player.direction, player.movingIndex, player.shooting, player.shootingDirIndex, player.leftButton, player.charged, player.swordAttack, player.swordDirIndex, player.swordAttackStage, player.dead);
        
        if(!gameStarted || dead) {
            var textX = xPos + PLAYER_SIZE / 2;
            var textY = yPos - 18;
            drawNick(player.nick, textX, textY);
        }

        for(var shot of player.shots) {
            drawShot(getX(shot.xPos), getY(shot.yPos), shot.angle);
        }
    }
}

function drawDeadTextures() {
    for(var texture of deadTextures) {
        const DIE_TEX_X = 3;
        const DIE_TEX_Y = 0;
        
        const DIE_OFFSET = 30;
        var renderX = getX(texture.xPos);
        var renderY = getY(texture.yPos) + DIE_OFFSET;

        skinsImages[texture.index][DIE_TEX_X][DIE_TEX_Y].drawRotated(renderX, renderY, getRadians(-90));
    }
}

// Funkcja wysyłająca do serwera dane gracza
function send() {
    socket.emit("update-player", {
        xPos: playerX,
        yPos: playerY,
        playerCode, direction,
        moving, movingIndex,

        shooting, shootingDirIndex,
        leftButton, charged,
        gameCode, shots,
        
        swordAttack, swordAttackStage,
        swordDirIndex
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

            if(!isCollision(playerX, playerY, moveX, moveY, direction) || dead) {
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
function drawPlayer(x, y, textureIndex, direction, movingIndex, shooting, shootingIndex, leftButton, charged, swordAttack, swordDirIndex, swordAttackStage, dead) {
    var texture = (dead ? ghostsImages : skinsImages)[textureIndex];
    var xOffset = direction;
    var yOffset = movingIndex + 1;

    const BOW_TEX = 3;
    const SWORD_TEX = 4;

    if(shooting) {
        var shootingTextures = weaponTextures[shootingIndex == LEFT ? "left" : "right"];
        var index = leftButton ? WEAPON_ACTIVE : WEAPON_DEFAULT;
        if(!charged) index = WEAPON_DEFAULT;

        xOffset = shootingTextures[index];
        yOffset = BOW_TEX;
    }
    if(swordAttack) {
        var attackTextures = weaponTextures[swordDirIndex == LEFT ? "left" : "right"];
        var index = swordAttackStage ? WEAPON_DEFAULT : WEAPON_ACTIVE;

        xOffset = attackTextures[index];
        yOffset = SWORD_TEX;
    }

    texture[xOffset][yOffset].draw(x, y);
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

    if(direction == RIGHT || direction == LEFT) yPos += hitbox.top + hitbox.height / 2;
    if(direction == DOWN || direction == UP) xPos += hitbox.left + hitbox.width / 2;

    if(direction == RIGHT) xPos += hitbox.right;
    if(direction == LEFT) xPos += hitbox.left;
    if(direction == DOWN) yPos += hitbox.bottom;
    if(direction == UP) yPos += hitbox.top;

    var tile = getTile(xPos, yPos);
    return tilesSolid[tile.type];
}

function getX(mapX) {
    return mapX - playerX + X_OFFSET;
}
function getY(mapY) {
    return mapY - playerY + Y_OFFSET;
}