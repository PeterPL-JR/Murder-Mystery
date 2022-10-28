const _MIN_PLAYERS = 4;
const _MAX_PLAYERS = 12;

const START_BUTTON_ID = "start-game-button";

function getAdmin(data) {
    if(data >= _MIN_PLAYERS) initAdminButton();
    else removeAdminButton();
}

function initAdminButton() {
    if(!document.getElementById(START_BUTTON_ID)) {
        const button = document.createElement("button");
        button.id = START_BUTTON_ID;
        button.innerHTML = "Rozpocznij";
        
        button.onclick = function() {
            socket.emit("start-game", {gameCode});
        }
        const buttonDiv = document.getElementById("button-div");
        if(buttonDiv) {
            buttonDiv.appendChild(button);
        }
    }
}

function removeAdminButton() {
    const button = document.getElementById(START_BUTTON_ID);
    if(button) button.remove();
}

function startGame(data) {
    gameStarted = true;
    createMapCoins(data.coins);

    playerX = data.xPos * TILE_SIZE - PLAYER_SIZE / 2 - TILE_SIZE / 2;
    playerY = data.yPos * TILE_SIZE - PLAYER_SIZE / 2 + TILE_SIZE / 2;
    send();
    
    lobbyBoard.div.remove();
    gameBoard.div.style.display = "block";
}