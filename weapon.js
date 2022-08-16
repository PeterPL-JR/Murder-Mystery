const SHOT_SPEED = 35;
const SHOT_DISTANCE = TILE_SIZE * 15;
const arrowTex = createImage("arrow.png");

const FIRE_RATE = 5;
var fireRateTime = FIRE_RATE;
var charged = true;

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

        if(this.getDistance() >= SHOT_DISTANCE) {
            this.destroy();
        }

        ctx.fillStyle = "red";

        var tileX = this.xPos + TILE_SIZE / 2;
        var tileY = this.yPos + TILE_SIZE / 2;

        var tile = getTile(tileX, tileY);
        
        if(!tile) this.destroy();
        else {
            var type = tilesNames[tile.type];
            if(tilesSolid[tile.type] && type != "water" && type != "rock") {
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

function drawShot(x, y, angle) {
    drawRotatedImage(arrowTex, x, y, TILE_SIZE, TILE_SIZE, angle);
}

function renderShots() {
    for (var s = 0; s < shots.length; s++) {
        var shot = shots[s];
        shot.update();
        if(shot.destroyed) {
            shots.splice(s, 1);
            send();
        }
    }
}