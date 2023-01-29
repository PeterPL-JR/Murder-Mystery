const ARROW_SIZE = 96;
const ARROW_HITBOX_SIZE = 24;

const D_BOW_SIZE = 112;
const D_BOW_FRAME_TIME = 9;
const D_BOW_MAX_FRAMES = 8;

const SHOT_SPEED = 35;
const SHOT_DISTANCE = TILE_SIZE * 15;
const arrowTex = new ImgAsset("arrow.png", ARROW_SIZE, ARROW_SIZE);
const dBowImage = createImage("bow.png");

const D_BOW_COLOR = COLOR_AQUA;
const D_BOW_OVERLAY_COLOR = "white";

let isDetectiveBow = false;
let detectiveBow = null;

const dBowHitbox = new Hitbox({
    rectangle: null,
    width: D_BOW_SIZE,
    height: D_BOW_SIZE
});

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

const PLAYER_FIRE_RATE = 5;
const DETECTIVE_FIRE_RATE = 24;

let FIRE_RATE = PLAYER_FIRE_RATE;
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

        this.hitbox = new ShotHitbox(ARROW_HITBOX_SIZE, this.angle, ARROW_SIZE);
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

        this.updateAttack();
    }
    destroy() {
        this.destroyed = true;
    }

    updateAttack() {
        const posArray = [this.xPos, this.yPos];
        const delinquents = attackPlayer(posArray, this.hitbox);
        
        if(defeatPlayer(delinquents, posArray, this.hitbox) != -1) {
            this.destroy();
        }
    }

    getDistance() {
        let xPos = this.xPos - this.startX;
        let yPos = this.yPos - this.startY;
        return Math.sqrt(Math.pow(xPos, 2) + Math.pow(yPos, 2))
    }
}

class DetectiveBow {
    constructor(xPos, yPos) {
        this.xPos = xPos;
        this.yPos = yPos;

        this.destroyed = false;
        this.init();
    }
    init() {
        this.anim = new Anim(dBowImage, this.xPos, this.yPos, D_BOW_SIZE, D_BOW_SIZE, D_BOW_FRAME_TIME, D_BOW_MAX_FRAMES);
    }

    update() {
        if(this.destroyed) return;
        this.anim.update();
    }
    render() {
        if(this.destroyed) return;
        this.anim.render();

        const renderX = getX(this.xPos) + D_BOW_SIZE / 2;
        const renderY = getY(this.yPos) - 12;
        drawNick("Łuk detektywa", renderX, renderY, D_BOW_COLOR, D_BOW_OVERLAY_COLOR);
    }
    destroy() {
        this.anim.destroy();
        this.destroyed = true;
    }
}

function swordAttack() {
    if(!gameStarted || PLAYER.role != ROLE_MURDERER) return;
    let thisPlayerPosition = [PLAYER.x, PLAYER.y];
    
    const delinquents = attackPlayer(thisPlayerPosition, hitbox.health);
    if(delinquents.length == 0) {
        SWORD.swordDirIndex = (PLAYER.direction == LEFT || PLAYER.direction == RIGHT) ? PLAYER.direction : LEFT;
        PLAYER.direction = SWORD.swordDirIndex;
        renderAttack();
        return;
    }

    const defeatedPlayer = defeatPlayer(delinquents, thisPlayerPosition, hitbox.health);
    SWORD.swordDirIndex = Hitbox.getSide(hitbox.health, hitbox.health, [defeatedPlayer.x, defeatedPlayer.y], thisPlayerPosition).horizontal;
    PLAYER.direction = SWORD.swordDirIndex;
    renderAttack();
}

function attackPlayer(murdererPosition, murdererHitbox) {
    let delinquents = [];
    for(let i = 0; i < otherPlayers.length; i++) {
        let player = otherPlayers[i].player;
        const playerPos = [player.x, player.y];

        if(player.playerCode == PLAYER.playerCode || player.dead) continue;
        if(!Hitbox.isCollision(murdererHitbox, hitbox.health, murdererPosition, playerPos)) continue;

        let sides = Hitbox.getSide(murdererHitbox, hitbox.health, murdererPosition, playerPos);
        delinquents.push({
            index: i,
            side: sides.horizontal
        });
    }
    return delinquents;
}

function defeatPlayer(delinquents, murdererPosition, murdererHitbox) {
    let playerIndex = -1;
    let playerPixels = -1;

    for(let obj of delinquents) {
        let player = otherPlayers[obj.index].player;
        let playerPos = [player.x, player.y];

        let pixels = Hitbox.commonPixels(murdererHitbox, hitbox.health, murdererPosition, playerPos);
        if(pixels > playerPixels) {
            playerPixels = pixels;
            playerIndex = obj.index;
        }
    }
    
    if(playerIndex == -1) {
        return playerIndex;
    }
    let defeatedPlayer = otherPlayers[playerIndex].player;
    
    const defeatedCode = defeatedPlayer.playerCode;
    const murdererCode = PLAYER.playerCode;
    socket.emit("defeat-player", {defeatedCode, gameCode: PLAYER.gameCode, murdererCode});
    return defeatedPlayer;
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

    fireRateTime = 0;
    if(isDetectiveBow) {
        startChargingBar();
    }

    arrows--;
    gameBoard.setString("arrows", arrows);
}

function checkBowCollision() {
    const playerPos = [PLAYER.x, PLAYER.y];
    const dBowPos = [detectiveBow.xPos, detectiveBow.yPos];
    const isCollision = Hitbox.isCollision(hitbox.coins, dBowHitbox, playerPos, dBowPos);

    if(isCollision) {
        socket.emit("detective-bow-taken", {gameCode: PLAYER.gameCode, playerCode: PLAYER.playerCode});
    }
}

function takeDetectiveBow() {
    if(detectiveBow != null) {
        detectiveBow.destroy();
    }
    detectiveBow = null;

    gameBoard.setDivString("detective", "Łuk podniesiony");
    gameBoard.setDivColor("detective", COLOR_GREEN);
}
function dropDetectiveBow(xPos, yPos) {
    const x = xPos + PLAYER_SIZE / 2 - D_BOW_SIZE / 2;
    const y = yPos + PLAYER_SIZE / 2 - D_BOW_SIZE / 2;
    detectiveBow = new DetectiveBow(x, y);

    gameBoard.setDivString("detective", "Łuk wyrzucony");
    gameBoard.setDivColor("detective", COLOR_RED);
}

function getDetectiveBow() {
    isDetectiveBow = true;
    isBow = true;
    arrows = 1;

    FIRE_RATE = DETECTIVE_FIRE_RATE;
    fireRateTime = FIRE_RATE;
    
    gameBoard.removeDiv("coins");
    gameBoard.removeDiv("arrows");

    gameBoard.addDiv("bow", "Łuk");
    gameBoard.setString("bow", "Gotowy");
    gameBoard.setColor("bow", COLOR_GREEN);
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

function updateFireRate() {
    BOW.charged = fireRateTime >= FIRE_RATE;
    
    if(time % 5 == 0 && fireRateTime < FIRE_RATE) {
        fireRateTime++;
        updateChargingBar(fireRateTime);

        if(isDetectiveBow && fireRateTime == FIRE_RATE) {
            setTimeout(function() {
                arrows++;
                stopChargingBar();
            }, 400);
        }
    }
}

function isPlayerReady() {
    return isBow && arrows > 0;
}