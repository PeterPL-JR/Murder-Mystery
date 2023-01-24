const PLAYER_SIZE = 160; // Wielkość obrazku gracza
const SPEED = 9; // Szybkość gracza
const TEX_SPEED = SPEED * 4; // Szybkość zmiany tekstury chodzenia

// Położenie początkowe x, y gracza na mapie
const PLAYER_BEGIN_OFFSET_X = PLAYER_SIZE / 2 - TILE_SIZE / 2;
const PLAYER_BEGIN_OFFSET_Y = PLAYER_SIZE / 2 + TILE_SIZE / 2;

// Położenie x, y gracza na obiekcie <canvas>
const X_OFFSET = WIDTH / 2 - PLAYER_SIZE / 2;
const Y_OFFSET = HEIGHT / 2 - PLAYER_SIZE / 2;

const PLAYER_NICK_COLOR = "white";
const PLAYER_OVERLAY_NICK_COLOR = "#121212";

const PLAYER = {
    skinIndex: 0,
    dead: false,
    direction: 0,

    movingIndex: -1,
    movingTime: 0,
    moving: false,
};

const _SKINS = 13; // Ilość postaci

let skinsImages = []; // Obrazki postaci
let ghostsImages = []; // Obrazki duchów
let otherPlayers = []; // Tablica innych graczy
let deadTextures = [];

const RIGHT = 0;
const LEFT = 1;
const DOWN = 2;
const UP = 3;

// Tablica kierunków
const dirs = [];
dirs[RIGHT] = "right";
dirs[LEFT] = "left";
dirs[DOWN] = "down";
dirs[UP] = "up";

// Klawisze poruszania się
const movingKeys = [];
movingKeys[RIGHT] = "D";
movingKeys[LEFT] = "A";
movingKeys[DOWN] = "S";
movingKeys[UP] = "W";

// Klawisze i kierunki poruszania
const allTheRightMoves = {};
allTheRightMoves[movingKeys[RIGHT]] = [1, 0];
allTheRightMoves[movingKeys[LEFT]] = [-1, 0];
allTheRightMoves[movingKeys[DOWN]] = [0, 1];
allTheRightMoves[movingKeys[UP]] = [0, -1];

// Funkcja renderująca graczy
function renderPlayers() {
    for (let playerData of otherPlayers) {
        const player = playerData.player;

        if (player.playerCode == PLAYER.playerCode) continue;
        if (player.dead && !PLAYER.dead) continue;

        let xPos = getX(player.x);
        let yPos = getY(player.y);
        drawPlayer(xPos, yPos, player, playerData.bow, playerData.sword);

        if (!gameStarted || PLAYER.dead) {
            let textX = xPos + PLAYER_SIZE / 2;
            let textY = yPos - 18;
            drawNick(player.nick, textX, textY, PLAYER_NICK_COLOR, PLAYER_OVERLAY_NICK_COLOR);
        }

        for (let shot of playerData.bow.shots) {
            drawShot(getX(shot.xPos), getY(shot.yPos), shot.angle);
        }
    }
}

function drawDeadTextures() {
    for (let texture of deadTextures) {
        const DIE_TEX_X = 3;
        const DIE_TEX_Y = 0;

        const DIE_OFFSET = 30;
        let renderX = getX(texture.xPos);
        let renderY = getY(texture.yPos) + DIE_OFFSET;

        skinsImages[texture.index][DIE_TEX_X][DIE_TEX_Y].drawRotated(renderX, renderY, getRadians(-90));
    }
}

// Funkcja wysyłająca do serwera dane gracza
function send() {
    const object = {
        player: PLAYER,
        bow: BOW,
        sword: SWORD
    };
    socket.emit("update-player", object);
}

// Funkcja poruszająca gracza w zależności od naciśniętego klawisza
function playerMoving() {
    for (let keyOfObj in keys) {
        let playerMove = allTheRightMoves[keyOfObj];

        // Poruszaj, gry klawisz jest naciśnięty oraz jest to W,S,D lub D
        if (keys[keyOfObj] && playerMove) {
            // Poruszaj gracza
            let moveX = playerMove[0];
            let moveY = playerMove[1];
            PLAYER.direction = movingKeys.indexOf(keyOfObj);

            if (!isCollision(PLAYER.x, PLAYER.y, moveX, moveY, PLAYER.direction) || PLAYER.dead) {
                move(moveX, moveY);
            }
        }
    }
    if (PLAYER.moving) {
        PLAYER.movingTime++;
        PLAYER.movingIndex = (PLAYER.movingTime % TEX_SPEED < TEX_SPEED / 2) ? 0 : 1;
    }
    send();
}

// Funkcja renderująca dowolnego gracza na mapie
function drawPlayer(x, y, player, bowObject, swordObject) {
    let texture = (player.dead ? ghostsImages : skinsImages)[player.skinIndex];
    let xOffset = player.direction;
    let yOffset = player.movingIndex + 1;

    const BOW_TEX = 3;
    const SWORD_TEX = 4;

    if (!player.dead) {
        if (bowObject.shooting) {
            let shootingTextures = weaponTextures[bowObject.shootingDirIndex == LEFT ? "left" : "right"];
            let index = bowObject.leftButton ? WEAPON_ACTIVE : WEAPON_DEFAULT;
            if (!bowObject.charged) index = WEAPON_DEFAULT;

            xOffset = shootingTextures[index];
            yOffset = BOW_TEX;
        }
        if (swordObject.swordAttack) {
            let attackTextures = weaponTextures[swordObject.swordDirIndex == LEFT ? "left" : "right"];
            let index = swordObject.swordAttackStage ? WEAPON_DEFAULT : WEAPON_ACTIVE;

            xOffset = attackTextures[index];
            yOffset = SWORD_TEX;
        }
    }

    texture[xOffset][yOffset].draw(x, y);
}

// Funkcja renderująca nick gracza
function drawNick(nick, x, y, color, overlayColor) {
    ctx.font = "bold 40px Verdana";
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.fillText(nick, x, y);

    ctx.strokeStyle = overlayColor;
    ctx.strokeText(nick, x, y);
}

// Funkcja poruszania się
function move(x, y) {
    PLAYER.x += x * SPEED;
    PLAYER.y += y * SPEED;
    PLAYER.moving = true;
}

function isCollision(playerX, playerY, moveX, moveY, direction) {
    let xPos = playerX + moveX;
    let yPos = playerY + moveY;

    if (direction == RIGHT || direction == LEFT) yPos += hitbox.player.top + hitbox.player.height / 2;
    if (direction == DOWN || direction == UP) xPos += hitbox.player.left + hitbox.player.width / 2;

    if (direction == RIGHT) xPos += hitbox.player.right;
    if (direction == LEFT) xPos += hitbox.player.left;
    if (direction == DOWN) yPos += hitbox.player.bottom;
    if (direction == UP) yPos += hitbox.player.top;

    let tile = getTile(xPos, yPos);
    return tilesSolid[tile.type];
}

function getX(mapX) {
    return mapX - PLAYER.x + X_OFFSET;
}
function getY(mapY) {
    return mapY - PLAYER.y + Y_OFFSET;
}