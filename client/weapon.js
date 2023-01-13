const ARROW_SIZE = 96;
const SHOT_SPEED = 35;
const SHOT_DISTANCE = TILE_SIZE * 15;
const arrowTex = new ImgAsset("arrow.png", ARROW_SIZE, ARROW_SIZE);

const BOW = {
    shooting: false,
    shootingDirIndex: -1,
    leftButton: false,
    charged: true,
    shots: []
};
const SWORD = {
    swordAttack: false,
    swordDirIndex: -1,
    swordAttackStage: -1
};

const FIRE_RATE = 5;
let fireRateTime = FIRE_RATE;

let isBow = false;
let arrows = 0;

const WEAPON_DEFAULT = 1;
const WEAPON_ACTIVE = 0;
let weaponTextures = {};

class ArrowShot {
    constructor(startX, startY, angle) {
        this.startX = startX;
        this.startY = startY;
        this.angle = angle;

        this.xSpeed = Math.cos(angle) * SHOT_SPEED;
        this.ySpeed = Math.sin(angle) * SHOT_SPEED;

        this.xPos = startX - TILE_SIZE / 2;
        this.yPos = startY - TILE_SIZE / 2;
        this.destroyed = false;
    }
    update() {
        this.xPos += this.xSpeed;
        this.yPos += this.ySpeed;

        if (this.getDistance() >= SHOT_DISTANCE) {
            this.destroy();
        }

        ctx.fillStyle = "red";

        let tileX = this.xPos + TILE_SIZE / 2;
        let tileY = this.yPos + TILE_SIZE / 2;

        let tile = getTile(tileX, tileY);

        if (!tile) this.destroy();
        else {
            let type = tilesNames[tile.type];
            if (tilesSolid[tile.type] && type != "water" && type != "rock") {
                this.destroy();
            }
        }

        let renderX = getX(this.xPos);
        let renderY = getY(this.yPos);

        drawShot(renderX, renderY, this.angle);
        send();
    }
    destroy() {
        this.destroyed = true;
    }

    getDistance() {
        let xPos = this.xPos - this.startX;
        let yPos = this.yPos - this.startY;
        return Math.sqrt(Math.pow(xPos, 2) + Math.pow(yPos, 2))
    }
}

function attack() {
    if(!gameStarted || PLAYER.role != ROLE_MURDERER) return;
    let pos = [PLAYER.x, PLAYER.y];
    
    let delinquents = [];
    for(let i = 0; i < otherPlayers.length; i++) {
        let player = otherPlayers[i].player;
        const playerPos = [player.x, player.y];

        if(player.playerCode == PLAYER.playerCode || player.dead) continue;
        if(!Hitbox.isCollision(hitbox.health, hitbox.health, pos, playerPos)) continue;

        let sides = Hitbox.getSide(hitbox.health, hitbox.health, pos, playerPos);
        delinquents.push({
            index: i,
            side: sides.horizontal
        });
    }

    if(delinquents.length == 0) {
        SWORD.swordDirIndex = (PLAYER.direction == LEFT || PLAYER.direction == RIGHT) ? PLAYER.direction : LEFT;
        PLAYER.direction = SWORD.swordDirIndex;
        renderAttack();
        return;
    }
    
    let playerIndex = -1;
    let playerPixels = -1;

    for(let obj of delinquents) {
        let player = otherPlayers[obj.index].player;
        let playerPos = [player.x, player.y];

        let pixels = Hitbox.commonPixels(hitbox.health, hitbox.health, pos, playerPos);
        if(pixels > playerPixels) {
            playerPixels = pixels;
            playerIndex = obj.index;
        }
    }

    let defeatedPlayer = otherPlayers[playerIndex].player;
    SWORD.swordDirIndex = Hitbox.getSide(hitbox.health, hitbox.health, [defeatedPlayer.x, defeatedPlayer.y], pos).horizontal;
    PLAYER.direction = SWORD.swordDirIndex;

    const defeatedCode = defeatedPlayer.playerCode;
    const murdererCode = PLAYER.playerCode;
    socket.emit("defeat-player", {defeatedCode, gameCode: PLAYER.gameCode, murdererCode});
    renderAttack();
}

function renderAttack() {
    const SWORD_ATTACK_TIME = 150;
    
    SWORD.swordAttack = true;
    SWORD.swordAttackStage = WEAPON_ACTIVE;
    send();
    setTimeout(function () {

        SWORD.swordAttackStage = WEAPON_DEFAULT;
        send();
        setTimeout(function () {
            SWORD.swordAttack = false;
            SWORD.swordAttackStage = -1;
            send();
        }, SWORD_ATTACK_TIME);

    }, SWORD_ATTACK_TIME);
}

function shoot(mouseX, mouseY) {
    if(!gameStarted) return;

    let playerCenterX = PLAYER.x + PLAYER_SIZE / 2;
    let playerCenterY = PLAYER.y + PLAYER_SIZE / 2;

    let xPos = mouseX + PLAYER.x - X_OFFSET;
    let yPos = mouseY + PLAYER.y - Y_OFFSET;

    let xLength = xPos - playerCenterX;
    let yLength = yPos - playerCenterY;

    let angle = Math.atan2(yLength, xLength);
    let shot = new ArrowShot(playerCenterX, playerCenterY, angle);
    BOW.shots.push(shot);
    send();

    arrows--;
    gameBoard.setString("arrows", arrows);
}

function drawShot(x, y, angle) {
    arrowTex.drawRotated(x, y, angle);
}

function renderShots() {
    for (let s = 0; s < BOW.shots.length; s++) {
        let shot = BOW.shots[s];
        shot.update();
        if (shot.destroyed) {
            BOW.shots.splice(s, 1);
            send();
        }
    }
}

function isPlayerReady() {
    return isBow && arrows > 0;
}