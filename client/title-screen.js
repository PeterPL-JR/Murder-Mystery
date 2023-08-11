const titleDiv = document.getElementById("title");
const subTitleDiv = document.getElementById("sub-title");

const TITLE_DISPLAY_TIME = 2000;
const TITLE_HIDE_TIME = 50;

let displayTitle = false;
let titleScreenTime = 0;

class TitleType {
    constructor(titleString, subTitleString, titleColor, subTitleColor, preTitleString=null) {
        this.titleString = titleString;
        this.subTitleString = subTitleString;

        this.titleColor = titleColor;
        this.subTitleColor = subTitleColor;
        this.preTitleString = preTitleString;
    }
}

const INNOCENT_TITLE = new TitleType(ROLES_NAMES[ROLE_INNOCENT], "Przeżyj jak najdłużej!", ROLES_COLORS[ROLE_INNOCENT], COLOR_YELLOW, "ROLA");
const MURDERER_TITLE = new TitleType(ROLES_NAMES[ROLE_MURDERER], "Zabij wszystkich graczy!", ROLES_COLORS[ROLE_MURDERER], COLOR_YELLOW, "ROLA");
const DETECTIVE_TITLE = new TitleType(ROLES_NAMES[ROLE_DETECTIVE], "Znajdź i schwywaj mordercę!", ROLES_COLORS[ROLE_DETECTIVE], COLOR_YELLOW, "ROLA");

const VICTORY_TITLE = new TitleType("WYGRAŁEŚ!", "Morderca został schwytany!", COLOR_GREEN, COLOR_GOLD);
const DEFEAT_TITLE = new TitleType("PRZEGRAŁEŚ!", "Wszyscy niewinni zginęli!", COLOR_RED, COLOR_GOLD);

const DEATH_TITLE_DEFAULT = new TitleType("ZGINĄŁEŚ!", null, COLOR_RED, null);
const DEATH_TITLE_1 = new TitleType("ZGINĄŁEŚ!", "Morderca cię pokonał", COLOR_RED, COLOR_YELLOW);
const DEATH_TITLE_2 = new TitleType("ZGINĄŁEŚ!", "Pokonałeś niewinnego gracza", COLOR_RED, COLOR_YELLOW);
const BOW_DROPPED_TITLE = new TitleType("ŁUK WYRZUCONY", "Detektyw został pokonany", COLOR_GREEN, COLOR_GOLD);

function startTitleScreen() {
    titleDiv.style.display = subTitleDiv.style.display = "block";
    titleDiv.style.opacity = subTitleDiv.style.opacity = 1;

    setTimeout(function() {
        displayTitle = true;
    }, TITLE_DISPLAY_TIME);
}
function updateTitleScreen() {
    titleScreenTime++;
    titleDiv.style.opacity = subTitleDiv.style.opacity = (TITLE_HIDE_TIME - titleScreenTime) / TITLE_HIDE_TIME;

    if(titleScreenTime >= TITLE_HIDE_TIME) {
        stopTitleScreen();
    }
}
function stopTitleScreen() {
    titleDiv.style.display = subTitleDiv.style.display = "none";
    titleDiv.style.opacity = subTitleDiv.style.opacity = 1;

    titleScreenTime = 0;
    displayTitle = false;
}

function setTitleScreen(titleType) {
    let spanHTML = `<span style='color: ${titleType.titleColor};'>${titleType.titleString}</span>`;

    titleDiv.innerHTML = (titleType.preTitleString) ? `${titleType.preTitleString}: ${spanHTML}` : spanHTML;
    subTitleDiv.innerHTML = `<span style='color: ${titleType.subTitleColor};'>${titleType.subTitleString}</span>`;
    
    startTitleScreen();
}