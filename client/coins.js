const COIN_SIZE = 64;
const COIN_FRAME_TIME = 9;
const COIN_MAX_FRAMES = 4;
const coinImage = createImage("coin.png");

let coins = 0;
let mapCoins = [];

let BOW_PRICE = 10;
let ARROWS_PRICE = 10;

function addCoin(coinsArray, index) {
    let animX = coinsArray[index].xPos * TILE_SIZE + TILE_SIZE / 2 - COIN_SIZE / 2;
    let animY = coinsArray[index].yPos * TILE_SIZE + TILE_SIZE / 2 - COIN_SIZE / 2;
    mapCoins[index] = {
        xPos: animX,
        yPos: animY,

        anim: new Anim(coinImage, animX, animY, COIN_SIZE, COIN_SIZE, COIN_FRAME_TIME, COIN_MAX_FRAMES, anims),
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
        for(let i = 0; i < array.length; i++) {
            if(array[i] != null) addCoin(array, i);
            else mapCoins[i] = null;
        }
    }
    for(let i = 0; i < array.length; i++) {
        if(mapCoins[i] != null && array[i] == null) deleteCoin(i);
        else if(mapCoins[i] == null && array[i] != null) addCoin(array, i);
    }
}

function pickCoin(index) {
    coins++;
    socket.emit("update-coins", {gameCode: PLAYER.gameCode, coinIndex: index});
    deleteCoin(index);
    
    if(!isBow && coins >= BOW_PRICE) {
        isBow = true;
        arrows++;
        coins = 0;
    }
    if(isBow && coins >= ARROWS_PRICE) {
        arrows++;
        coins = 0;
    }

    gameBoard.setString("coins", coins);
    gameBoard.setString("arrows", arrows);
}

function checkCoinCollision(playerX, playerY) {

    let index = mapCoins.findIndex(function(coin) {
        if(coin == null) return false;
        return Hitbox.isCollision(
            hitbox.coins,
            coin.hitbox,

            [playerX, playerY],
            [coin.xPos, coin.yPos]
        );
    });
    if(index != -1) {
        pickCoin(index);
    }
}