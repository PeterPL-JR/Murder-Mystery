var gameContainer = document.getElementById("game-container");
var loginContainer = document.getElementById("login-container");

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

function joinGame() {
    document.body.style.backgroundColor = "#121212";

    gameContainer.style.display = "inline-block";
    loginContainer.style.display = "none";

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
}