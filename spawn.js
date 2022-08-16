const coinTex = createImage("coin.png");
const _COINS = 12;
const COIN_SIZE = 64;
const FRAME_TIME = 9;

const mapCoins = [];
var spawnPositions = [];

function initSpawn() {
    for(var i = 0; i < _COINS; i++) {
        mapCoins[i] = null;
    }
    setInterval(function() {
        var index = getRandom(0, _COINS - 1);
        if(mapCoins[index] == null) {
            spawnCoin(index);
        }
    }, 1000);
}

function spawnCoin(index) {
    var spawnX = spawnPositions[index][0] * TILE_SIZE;
    var spawnY = spawnPositions[index][1] * TILE_SIZE;
    mapCoins[index] = new Anim(coinTex, spawnX, spawnY, COIN_SIZE, COIN_SIZE, FRAME_TIME);
}
