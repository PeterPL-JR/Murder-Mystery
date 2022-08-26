const COIN_SIZE = 64;
const COIN_FRAME_TIME = 9;
const coinTex = createImage("coin.png");

var coins = 0;
var mapCoins = [];

function addCoin(coinsArray, index) {
    var animX = coinsArray[index].xPos * TILE_SIZE;
    var animY = coinsArray[index].yPos * TILE_SIZE;
    mapCoins[index] = new Anim(coinTex, animX, animY, COIN_SIZE, COIN_SIZE, COIN_FRAME_TIME);
}
function deleteCoin(index) {
    mapCoins[index].destroy();
    mapCoins[index] = null;
}

function createMapCoins(array) {
    if(mapCoins.length == 0) {
        for(var i = 0; i < array.length; i++) {
            if(array[i] != null) addCoin(array, i);
            else mapCoins[i] = null;
        }
    }
    for(var i = 0; i < array.length; i++) {
        if(mapCoins[i] != null && array[i] == null) deleteCoin(i);
        else if(mapCoins[i] == null && array[i] != null) addCoin(array, i);
    }
}

function pickCoin(index) {
    coins++;
    socket.emit("update-coins", {gameCode, coinIndex: index});

    deleteCoin(index);
    console.log("Coins:", coins);
}

function checkCoinCollision(playerX, playerY) {
    var index = mapCoins.findIndex(function(coin) {
        if(coin == null) return false;
        var condX = playerX > coin.xPos + COIN_SIZE || playerX + PLAYER_SIZE < coin.xPos;
        var condY = playerY > coin.yPos + COIN_SIZE || playerY + PLAYER_SIZE < coin.yPos;
        return !(condX || condY);
    });
    if(index != -1) {
        pickCoin(index);
    }
}