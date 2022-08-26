var overlayDiv = document.getElementById("overlay-div");
var boardDivs = {};
var boardDataDivs = {};

const COLOR_GREEN = "#65ff65";
const COLOR_YELLOW = "#ffff65";
const COLOR_RED = "#ff6565";

function initBoard() {
    overlayDiv.style.width = WIDTH + "px";
    overlayDiv.style.height = HEIGHT + "px";

    var divs = document.querySelectorAll("#board > div:not([id='logo'])");
    for(var div of divs) {
        boardDivs[div.id] = div;
        boardDataDivs[div.id] = div.querySelector("span");
    }
    setBoardColor("arrows", COLOR_YELLOW);
    setBoardColor("coins", COLOR_YELLOW);
}

function setBoardColor(id, color) {
    boardDataDivs[id].style.color = color;
}

function setBoardDivString(id, string) {
    boardDivs[id] = string;
}
function setBoardString(id, string) {
    boardDataDivs[id].innerHTML = string;
}