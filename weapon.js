const SHOT_SPEED = 15;
const arrowTex = createImage("arrow.png");

class ArrowShot {
    constructor(startX, startY, angle) {        
        this.angle = angle;

        this.xSpeed = Math.cos(angle) * SHOT_SPEED;
        this.ySpeed = Math.sin(angle) * SHOT_SPEED;
        
        this.xPos = startX - TILE_SIZE / 2;
        this.yPos = startY - TILE_SIZE / 2;
    }
    update() {
        this.xPos += this.xSpeed;
        this.yPos += this.ySpeed;
        ctx.fillStyle = "red";

        var renderX = this.xPos - playerX + X_OFFSET;
        var renderY = this.yPos - playerY + Y_OFFSET;

        drawRotatedImage(arrowTex, renderX, renderY, TILE_SIZE, TILE_SIZE, this.angle);
    }
}