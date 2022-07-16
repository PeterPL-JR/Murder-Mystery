var gameContainer = document.getElementById("game-container");
var loginContainer = document.getElementById("login-container");

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

var playerX = 0;
var playerY = 0;

var playerImg = createImage("player.png");
var grass = createImage("grass.png");

function joinGame() {
    document.body.style.backgroundColor = "#121212";

    gameContainer.style.display = "inline-block";
    loginContainer.style.display = "none";

    draw();
}

function draw() {
    requestAnimationFrame(draw);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    
    ctx.drawImage(grass, playerX, playerY);
    ctx.drawImage(playerImg, playerX, playerY);
}

function createImage(path) {
    var image = document.createElement("img");
    image.src = "images/" + path;
    return image;
}