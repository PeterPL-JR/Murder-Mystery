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

    static getSide(h1, h2, pos1, pos2) {

        var hSide = h1.left + pos1[0] < h2.left + pos2[0] ? LEFT : RIGHT;
        var vSide = h1.top + pos1[1] < h2.top + pos2[1] ? UP : DOWN;

        return {
            horizontal: hSide,
            vertical: vSide
        };
    }

    static commonPixels(h1, h2, pos1, pos2) {
        const sides = ["right", "left", "bottom", "top"];

        var side1 = Hitbox.getSide(h1, h2, pos1, pos2);
        var side2 = Hitbox.getSide(h2, h1, pos2, pos1);

        var hWay1 = h1[sides[side1.horizontal]] - pos1[0];
        var hWay2 = h2[sides[side2.horizontal]] - pos2[0];

        var vWay1 = h1[sides[side1.vertical]] - pos1[1];
        var vWay2 = h2[sides[side2.vertical]] - pos2[1];

        var horizontal = Math.abs(hWay1 - hWay2);
        var vertical = Math.abs(vWay1 - vWay2);

        if(horizontal == 0) horizontal = h1.width;
        if(vertical == 0) vertical = h1.height;

        return horizontal * vertical;
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