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
        if(tilesSolid[tile.type]) {
            this.destroy();
        }

        var renderX = this.xPos - playerX + X_OFFSET;
        var renderY = this.yPos - playerY + Y_OFFSET;

        drawRotatedImage(arrowTex, renderX, renderY, TILE_SIZE, TILE_SIZE, this.angle);
    }
    destroy() {
        this.destroyed = true;
    }
}