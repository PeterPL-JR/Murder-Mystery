let choosenSkin = 0; // Aktualnie wybrany skin

let button = document.getElementById("button"); // Przycisk dołączający do gry
let textureDiv = document.getElementById("skin-div"); // Div wyboru skina
let infoDiv = document.getElementById("info");

const codeInput = document.getElementById("code");
const nickInput = document.getElementById("nick");

// Strzałki
let arrow1 = document.getElementById("arrow1");
let arrow2 = document.getElementById("arrow2");

// Kod dziejący się po kliknięciu strzałek
arrow1.onmousedown = function() {
    switchSkin(-1);
}
arrow2.onmousedown = function() {
    switchSkin(1);
}

// Kod dziejący się po kliknięciu przycisku
button.onclick = function () {
    let code = codeInput.value;
    let nick = nickInput.value;
    let playerCode = getRandom(1_000_000_000_000_000, 9_999_999_999_999_999);

    // Dołącz, jeżeli nick nie jest pusty i kod gry jest liczbą
    if (!isNaN(code) && nick != "") {
        let socket = io();
        socket.emit("check-room", {code});
        socket.on("check-room", function(data) {

            if(data.isGameStarted)
                infoDiv.innerHTML = "(<b>Gra już trwa</b>)";
            else if(data.playersNumber >= _MAX_PLAYERS) 
                infoDiv.innerHTML = "(<b>Pokój jest pełny!</b>)";
            else {
                socket.emit("join-game", { code, nick, playerCode, choosenSkin });
                joinGame({ socket, nick, playerCode, choosenSkin, code });
            }
        });
    }
}

codeInput.onkeydown = function() {
    infoDiv.innerHTML = null;
}

switchSkin(0);
// button.click();

// Funkcja przełączająca skina
function switchSkin(direction) {
    choosenSkin += direction;
    if(choosenSkin >= _SKINS) choosenSkin = 0;
    if(choosenSkin < 0) choosenSkin = _SKINS - 1;

    textureDiv.innerHTML = `<img src='images/players/player${choosenSkin + 1}.png'>`;
}

// Funkcja zwracająca losową liczbę z przedziału od MIN do MAX włącznie
function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}