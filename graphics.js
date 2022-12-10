class ImgAsset {
    constructor(source, width, height, sx, sy, swidth, sheight) {
        this.source = source;

        this.width = width;
        this.height = height

        this.sx = sx;
        this.sy = sy;

        this.swidth = swidth;
        this.sheight = sheight;

        this.init();
    }
    init() {
        if((typeof this.source) == "string") {
            this.image = document.createElement("img");
            this.image.onload = this.ready.bind(this);
            this.image.src = "images/" + this.source;
        }
        if((typeof this.source) == "object") {
            this.image = this.source;
            this.ready();
        }
    }
    ready() {
        if(this.sx == undefined || this.sy == undefined || !this.swidth || !this.sheight) {
            this.sx = 0;
            this.sy = 0;

            this.swidth = this.image.width;
            this.sheight = this.image.height;
        }
    }
    draw(x, y) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this.image, this.sx, this.sy, this.swidth, this.sheight, x, y, this.width, this.height);
    }
    drawRotated(x, y, angle) {
        let translateX = x + this.width / 2;
        let translateY = y + this.height / 2;

        ctx.translate(translateX, translateY);
        ctx.rotate(angle);
        ctx.drawImage(this.image, this.sx, this.sy, this.swidth, this.sheight, -this.width / 2, -this.height / 2, this.width, this.height);

        ctx.rotate(-angle);
        ctx.translate(-translateX, -translateY);
    }
}

class Anim {
    constructor(image, x, y, width, height, frameTime, maxFrames) {
        this.image = image;
        
        this.width = width;
        this.height = height;
        
        this.xPos = x;
        this.yPos = y;

        this.frame = 0;
        this.startTime = time;
        this.destroyed = false;

        this.frameTime = frameTime;
        this.maxFrames = maxFrames
        this.init();
    }
    
    init() {
        this.swidth = this.image.width / this.maxFrames;
        this.sheight = this.image.height;

        this.framesImages = [];
        for(let i = 0; i < this.maxFrames; i++) {
            this.framesImages.push(new ImgAsset(this.image, this.width, this.height, i * this.swidth, 0, this.swidth, this.sheight));
        }

        this.index = anims.length;
        anims.push(this);
    }
    destroy() {
        anims.splice(this.index, 1);
        this.destroyed = true;
    }
    update() {
        if((time - this.startTime) % this.frameTime == 0 && !this.destroyed) {
            this.frame++;
            if(this.frame >= this.maxFrames) {
                this.frame = 0;
            }
        }
    }
    render() {
        if(this.destroyed) return;
        
        var renderX = getX(this.xPos);
        var renderY = getY(this.yPos);
        this.framesImages[this.frame].draw(renderX, renderY);
    }
}

// Funkcja ładująca pojedynczy obrazek
function createImage(path) {
    var image = document.createElement("img");
    image.src = "images/" + path;
    return image;
}