var overlayDiv = document.getElementById("overlay-div");
var gameBoard, lobbyBoard;

const COLOR_GREEN = "#65ff65";
const COLOR_YELLOW = "#ffff65";
const COLOR_RED = "#ff6565";
const COLOR_AQUA = "#65ffff";

class Board {
    constructor(id) {
        this.id = id;
        this.boardDivs = {};
        this.boardDataDivs = {};
        this.init();
    }
    init() {
        var divs = document.querySelectorAll(`#${this.id} > div:not([id='logo']):not([id='button-div'])`);
        for(var div of divs) {
            this.boardDivs[div.id] = div;
            this.boardDataDivs[div.id] = div.querySelector("span");
        }
    }
    setColor(id, color) {
        this.boardDataDivs[id].style.color = color;
    }
    setDivString(id, string) {
        this.boardDivs[id].innerHTML = string;
    }
    setString(id, string) {
        this.boardDataDivs[id].innerHTML = string;
    }
}

function initBoards() {
    overlayDiv.style.width = WIDTH + "px";
    overlayDiv.style.height = HEIGHT + "px";

    gameBoard = new Board("game-board");
    lobbyBoard = new Board("lobby-board");

    gameBoard.setColor("arrows", COLOR_YELLOW);
    gameBoard.setColor("coins", COLOR_YELLOW);
    lobbyBoard.setColor("game-code", COLOR_YELLOW);
}