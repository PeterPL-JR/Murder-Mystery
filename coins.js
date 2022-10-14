const COIN_SIZE = 64;
const COIN_FRAME_TIME = 9;
const coinTex = createImage("coin.png");

var coins = 0;
var mapCoins = [];

var BOW_PRICE = 10;
var ARROWS_PRICE = 10;

function addCoin(coinsArray, index) {
    var animX = coinsArray[index].xPos * TILE_SIZE;
    var animY = coinsArray[index].yPos * TILE_SIZE;
    mapCoins[index] = {
        xPos: animX,
        yPos: animY,

        anim: new Anim(coinTex, animX, animY, COIN_SIZE, COIN_SIZE, COIN_FRAME_TIME),
        hitbox: new Hitbox({
            rectangle: null,
            width: COIN_SIZE,
            height: COIN_SIZE
        })
    };
}
function deleteCoin(index) {
    mapCoins[index].anim.destroy();
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
    
    if(!bow && coins >= BOW_PRICE) {
        bow = true;
        arrows++;
        coins = 0;
    }
    if(bow && coins >= ARROWS_PRICE) {
        arrows++;
        coins = 0;
    }

    gameBoard.setString("coins", coins);
    gameBoard.setString("arrows", arrows);
}

function checkCoinCollision(playerX, playerY) {

    var index = mapCoins.findIndex(function(coin) {
        if(coin == null) return false;
        return Hitbox.isCollision(
            coinsHitbox,
            coin.hitbox,

            [playerX, playerY],
            [coin.xPos, coin.yPos]
        );
    });
    if(index != -1) {
        pickCoin(index);
    }
}