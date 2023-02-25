let overlayDiv = document.getElementById("overlay-div");
let gameBoard, lobbyBoard;

let progressBar = null;

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
        let divs = document.querySelectorAll(`#${this.id} > div:not([id='logo']):not([id='button-div'])`);
        for(let div of divs) {
            this.boardDivs[div.id] = div;
            this.boardDataDivs[div.id] = div.querySelector("span");
        }
    }
    setDivColor(id, color) {
        this.boardDivs[id].style.color = color;
    }
    setColor(id, color) {
        this.boardDataDivs[id].style.color = color;
    }
    setDivString(id, string) {
        this.boardDivs[id].style.fontWeight = "bold";
        this.boardDivs[id].innerHTML = string;
    }
    setString(id, string) {
        this.boardDataDivs[id].innerHTML = string;
    }

    addDiv(id, title) {
        if(Object.keys(this.boardDivs).indexOf(id) != -1) return;

        let div = document.createElement("div");
        div.innerHTML = `<div>${title}:</div><span></span>`;
        div.id = id;
        this.div.appendChild(div);

        this.boardDivs[id] = div;
        this.boardDataDivs[id] = div.querySelector("span");
    }
    removeDiv(id) {
        let div = this.boardDivs[id];
        if(div) div.remove();
    }
}

const COMPASS_RADIUS = 42;
const COMPASS_BORDER_WIDTH = 11;

const COMPASS_X = WIDTH - COMPASS_RADIUS - COMPASS_BORDER_WIDTH - 20;
const COMPASS_Y = HEIGHT - COMPASS_RADIUS - COMPASS_BORDER_WIDTH - 20;

const COMPASS_COLOR = "#242424";
const COMPASS_BORDER_COLOR = "gray";
const COMPASS_BOTTOM_COLOR = "#3d3d3d";

const NORTH_ARROW_COLOR = "red";
const SOUTH_ARROW_COLOR = "white";

const ARROW_BASE_SIZE = 14;
const ARROW_HEIGHT = COMPASS_RADIUS - 10;

class Compass {
    constructor(bowX, bowY) {
        this.bowX = bowX;
        this.bowY = bowY;
        this.angle = 0;
    }
    update(playerX, playerY) {
        this.angle = Math.atan2(playerY - this.bowY, playerX - this.bowX) - Math.PI / 2;
    }
    render() {
        drawCircle(COMPASS_X, COMPASS_Y + 10, COMPASS_RADIUS + COMPASS_BORDER_WIDTH / 2, COMPASS_BOTTOM_COLOR);
        drawCircle(COMPASS_X, COMPASS_Y, COMPASS_RADIUS, COMPASS_COLOR, COMPASS_BORDER_COLOR, COMPASS_BORDER_WIDTH);

        ctx.translate(COMPASS_X, COMPASS_Y);
        ctx.rotate(this.angle);
        
        drawArrow(0, 0, ARROW_BASE_SIZE, ARROW_HEIGHT, NORTH_ARROW_COLOR);
        drawArrow(0, 0, ARROW_BASE_SIZE, -ARROW_HEIGHT, SOUTH_ARROW_COLOR);
        
        ctx.rotate(-this.angle);
        ctx.translate(-COMPASS_X, -COMPASS_Y);
    }
}

class ProgressBar {
    static _ELEMS = 4;

    constructor(maxTime) {
        this.maxTime = maxTime;
        this.elems = [];
        this.init();
    }
    init() {
        this.div = document.createElement("div");
        this.div.id = "progress-bar";

        for(let i = 0; i < ProgressBar._ELEMS; i++) {
            let div = document.createElement("div");
            this.div.appendChild(div);
            this.elems.push(div);
        }
    }
    update(time, span) {
        const percent = Math.floor(time * 100 / this.maxTime);
        const coloredDivsAmount = Math.floor(percent / (100 / ProgressBar._ELEMS));

        const colors = [COLOR_RED, COLOR_YELLOW, COLOR_GREEN, COLOR_GREEN];
        const color = colors[coloredDivsAmount - 1];
        
        const percentString = percent.toString();
        let displayedPercent = 0;

        if(percentString.length == 2) {
            displayedPercent = percentString[0] + "0";
        }
        if(percentString.length == 3) {
            displayedPercent = 100;
        }

        span.style.color = color;
        span.innerHTML = displayedPercent + "%";

        for(let i = 0; i < coloredDivsAmount; i++) {
            this.elems[i].style.backgroundColor = color;
            this.elems[i].style.outline = "none";
        }
    }
    append(boardDiv, elemAfter) {
        boardDiv.insertBefore(this.div, elemAfter);
    }
    remove() {
        this.div.remove();
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

function startChargingBar() {
    progressBar = new ProgressBar(FIRE_RATE);
    
    const boardDiv = gameBoard.boardDivs['bow'];
    const elemAfter = gameBoard.boardDataDivs['bow'];
    progressBar.append(boardDiv, elemAfter);
    
    gameBoard.setString("bow", "0%");
    gameBoard.setColor("bow", COLOR_RED);
}
function stopChargingBar() {
    progressBar.remove();

    gameBoard.setString("bow", "Gotowy");
    gameBoard.setColor("bow", COLOR_GREEN);
}

function updateChargingBar(fireRateTime) {
    const span = gameBoard.boardDataDivs['bow'];
    progressBar.update(fireRateTime, span);
}