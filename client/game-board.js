var overlayDiv = document.getElementById("overlay-div");
var gameBoard, lobbyBoard;

const ROLE_INNOCENT = 0;
const ROLE_MURDERER = 1;
const ROLE_DETECTIVE = 2;
const ROLE_DEAD = 3;

const COLOR_GREEN = "#65ff65";
const COLOR_YELLOW = "#ffff65";
const COLOR_RED = "#ff6565";
const COLOR_AQUA = "#65ffff";
const COLOR_GRAY = "#969696";

const ROLES_COLORS = [];
const ROLES_NAMES = [];

ROLES_COLORS[ROLE_INNOCENT] = COLOR_GREEN;
ROLES_COLORS[ROLE_MURDERER] = COLOR_RED;
ROLES_COLORS[ROLE_DETECTIVE] = COLOR_AQUA;
ROLES_COLORS[ROLE_DEAD] = COLOR_GRAY;

ROLES_NAMES[ROLE_INNOCENT] = "Niewinny";
ROLES_NAMES[ROLE_MURDERER] = "Morderca";
ROLES_NAMES[ROLE_DETECTIVE] = "Detektyw";
ROLES_NAMES[ROLE_DEAD] = "Duch";

class Board {
    constructor(id) {
        this.id = id;
        this.boardDivs = {};
        this.boardDataDivs = {};
        this.init();
    }
    init() {
        this.div = document.getElementById(this.id);
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