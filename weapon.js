const SHOT_SPEED = 35;
const SHOT_DISTANCE = TILE_SIZE * 15;
const arrowTex = createImage("arrow.png");

const FIRE_RATE = 5;
var fireRateTime = FIRE_RATE;
var charged = true;

var bow = false;
var arrows = 0;

const WEAPON_DEFAULT = 1;
const WEAPON_ACTIVE = 0;
var weaponTextures = {};

var shooting = false;
var leftButton = false;
var shootingDirIndex = -1;

var swordAttack = false;
var swordAttackStage = -1;
var swordDirIndex = -1;

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

        var tileX = this.xPos + TILE_SIZE / 2;
        var tileY = this.yPos + TILE_SIZE / 2;

        var tile = getTile(tileX, tileY);

        if (!tile) this.destroy();
        else {
            var type = tilesNames[tile.type];
            if (tilesSolid[tile.type] && type != "water" && type != "rock") {
                this.destroy();
            }
        }

        var renderX = getX(this.xPos);
        var renderY = getY(this.yPos);

        drawShot(renderX, renderY, this.angle);
        send();
    }
    destroy() {
        this.destroyed = true;
    }

    getDistance() {
        var xPos = this.xPos - this.startX;
        var yPos = this.yPos - this.startY;
        return Math.sqrt(Math.pow(xPos, 2) + Math.pow(yPos, 2))
    }
}

function attack() {
    var pos = [playerX, playerY];
    
    var delinquents = [];
    for(var i = 0; i < otherPlayers.length; i++) {
        var player = otherPlayers[i];
        const playerPos = [player.xPos, player.yPos];

        if(player.playerCode == playerCode) continue;
        if(!Hitbox.isCollision(healthHitbox, healthHitbox, pos, playerPos)) continue;

        var sides = Hitbox.getSide(healthHitbox, healthHitbox, pos, playerPos);
        delinquents.push({
            index: i,
            side: sides.horizontal
        });
    }

    if(delinquents.length == 0) {
        swordDirIndex = (direction == LEFT || direction == RIGHT) ? direction : LEFT;
        direction = swordDirIndex;
        renderAttack();
        return;
    }
    
    var playerIndex = -1;
    var playerPixels = -1;

    for(var obj of delinquents) {
        var player = otherPlayers[obj.index];
        var playerPos = [player.xPos, player.yPos];

        var pixels = Hitbox.commonPixels(healthHitbox, healthHitbox, pos, playerPos);
        if(pixels > playerPixels) {
            playerPixels = pixels;
            playerIndex = obj.index;
        }
    }

    var player = otherPlayers[playerIndex];
    swordDirIndex = Hitbox.getSide(healthHitbox, healthHitbox, [player.xPos, player.yPos], pos).horizontal;
    direction = swordDirIndex;
    renderAttack();
}

function renderAttack() {
    const SWORD_ATTACK_TIME = 150;
    
    swordAttack = true;
    swordAttackStage = WEAPON_ACTIVE;
    send();
    setTimeout(function () {

        swordAttackStage = WEAPON_DEFAULT;
        send();
        setTimeout(function () {
            swordAttack = false;
            swordAttackStage = -1;
            send();
        }, SWORD_ATTACK_TIME);

    }, SWORD_ATTACK_TIME);
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

    arrows--;
    setBoardString("arrows", arrows);
}

function drawShot(x, y, angle) {
    drawRotatedImage(arrowTex, x, y, TILE_SIZE, TILE_SIZE, angle);
}

function renderShots() {
    for (var s = 0; s < shots.length; s++) {
        var shot = shots[s];
        shot.update();
        if (shot.destroyed) {
            shots.splice(s, 1);
            send();
        }
    }
}

function isPlayerReady() {
    return bow && arrows > 0;
}