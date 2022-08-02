var choosenSkin = 0; // Aktualnie wybrany skin

var button = document.getElementById("button"); // Przycisk dołączający do gry
var textureDiv = document.getElementById("skin-div"); // Div wyboru skina

// Strzałki
var arrow1 = document.getElementById("arrow1");
var arrow2 = document.getElementById("arrow2");

// Kod dziejący się po kliknięciu strzałek
arrow1.onmousedown = function() {
    switchSkin(-1);
}
arrow2.onmousedown = function() {
    switchSkin(1);
}

// Kod dziejący się po kliknięciu przycisku
button.onclick = function () {
    var code = document.getElementById("code").value;
    var nick = document.getElementById("nick").value;
    var playerCode = getRandom(1_000_000_000_000_000, 9_999_999_999_999_999);

    // Dołącz, jeżeli nick nie jest pusty i kod gry jest liczbą
    if (!isNaN(code) && nick != "") {
        var socket = io();
        socket.emit("join-game", { code, nick, playerCode, choosenSkin });
        joinGame({ socket, nick, playerCode, choosenSkin, code });
    }
}
switchSkin(0);
button.click();

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