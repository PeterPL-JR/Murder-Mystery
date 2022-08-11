const SHOT_SPEED = 35;
const arrowTex = createImage("arrow.png");

const FIRE_RATE = 5;
var fireRateTime = FIRE_RATE;
var charged = true;

class ArrowShot {
    constructor(startX, startY, angle) {        
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

        var renderX = this.xPos - playerX + X_OFFSET;
        var renderY = this.yPos - playerY + Y_OFFSET;

        drawShot(renderX, renderY, this.angle);
        send();
    }
    destroy() {
        this.destroyed = true;
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