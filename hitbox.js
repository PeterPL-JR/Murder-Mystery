const RIGHT = 0; 
const LEFT = 1;

const DOWN = 2; 
const UP = 3; 

var hitbox;

var healthHitbox;
var coinsHitbox;

class Hitbox {
    constructor(hitboxData) {
        this.rect = hitboxData.rectangle;
        if(this.rect == null) {
            this.rect = {
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
            };
        }
        this.bWidth = hitboxData.width;
        this.bHeight = hitboxData.height;

        this.left = this.rect.left;
        this.top = this.rect.top;

        this.width = this.bWidth - this.rect.right - this.rect.left;
        this.height = this.bHeight - this.rect.bottom - this.rect.top;

        this.right = this.left + this.width;
        this.bottom = this.top + this.height;
    }

    render(x, y, color) {
        ctx.strokeStyle = color;
        ctx.strokeRect(x + this.left, y + this.top, this.width, this.height);
    }

    static isCollision(h1, h2, pos1, pos2) {
        const condX = h1.left + pos1[0] > h2.right + pos2[0] || h1.right + pos1[0] < h2.left + pos2[0];
        const condY = h1.top + pos1[1] > h2.bottom + pos2[1] || h1.bottom + pos1[1] < h2.top + pos2[1];
        return !(condX || condY);
    }
}

function initHitboxes() {
    hitbox = new Hitbox({
        rectangle: {
            left: 60,
            right: 60,
            top: 90,
            bottom: 25,
        },
        width: PLAYER_SIZE,
        height: PLAYER_SIZE
    });
    healthHitbox = new Hitbox({
        rectangle: {
            left: 40,
            right: 40,
            top: 10,
            bottom: 10,
        },
        width: PLAYER_SIZE,
        height: PLAYER_SIZE
    });
    coinsHitbox = new Hitbox({
        rectangle: {
            left: 40,
            right: 40,
            top: 80,
            bottom: 20,
        },
        width: PLAYER_SIZE,
        height: PLAYER_SIZE
    });
}