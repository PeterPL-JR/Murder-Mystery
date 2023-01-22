const hitbox = {};

class Hitbox {
    constructor(hitboxData) {
        if(hitboxData != null) {
            this.init(hitboxData);
        }
    }

    init(hitboxData) {
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

        let hSide = h1.left + pos1[0] < h2.left + pos2[0] ? LEFT : RIGHT;
        let vSide = h1.top + pos1[1] < h2.top + pos2[1] ? UP : DOWN;

        return {
            horizontal: hSide,
            vertical: vSide
        };
    }

    static commonPixels(h1, h2, pos1, pos2) {
        const sides = ["right", "left", "bottom", "top"];

        let side1 = Hitbox.getSide(h1, h2, pos1, pos2);
        let side2 = Hitbox.getSide(h2, h1, pos2, pos1);

        let hWay1 = h1[sides[side1.horizontal]] - pos1[0];
        let hWay2 = h2[sides[side2.horizontal]] - pos2[0];

        let vWay1 = h1[sides[side1.vertical]] - pos1[1];
        let vWay2 = h2[sides[side2.vertical]] - pos2[1];

        let horizontal = Math.abs(hWay1 - hWay2);
        let vertical = Math.abs(vWay1 - vWay2);

        if(horizontal == 0) horizontal = h1.width;
        if(vertical == 0) vertical = h1.height;

        return horizontal * vertical;
    }
}

class ShotHitbox extends Hitbox {
    constructor(hitboxSize, angle, shotSize) {
        super(null);
        this.init(hitboxSize, angle, shotSize);
    }
    init(hitboxSize, angle, shotSize) {
        const RADIUS = shotSize / 2 - hitboxSize / 2;
        const x = Math.cos(angle) * RADIUS;
        const y = Math.sin(angle) * RADIUS;

        const left = shotSize / 2 + x - hitboxSize / 2;
        const top = shotSize / 2 + y - hitboxSize / 2;

        const rectangle = {
            left,
            right: shotSize - hitboxSize - left,
            top,
            bottom: shotSize - hitboxSize - top
        };
        super.init({
            rectangle,
            width: shotSize,
            height: shotSize
        });
    }
}

function initHitboxes(data) {
    for(let hitboxName in data) {
        const keyName = hitboxName.substring(0, hitboxName.length - 6);
        const hitboxData = data[hitboxName];

        hitboxData.width = eval(hitboxData.width);
        hitboxData.height = eval(hitboxData.height);

        hitbox[keyName] = new Hitbox(hitboxData);
    }
}