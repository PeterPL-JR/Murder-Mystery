const _COINS = 12;
const {getRandom} = require("./functions");

class CoinsGenerator {
    constructor(spawnPositions, gameCode, sendCoins) {
        this.mapCoins = [];

        this.sendCoins = sendCoins;
        this.spawnPositions = spawnPositions;
        this.gameCode = gameCode;
        this.initSpawn();
    }

    initSpawn() {
        for(var i = 0; i < _COINS; i++) {
            this.mapCoins[i] = null;
        }
        
        var trySpawn = this.trySpawn.bind(this);
        this.interval = setInterval(function() {
            trySpawn();
        }, 1000);
    }
    destroy() {
        clearInterval(this.interval);
    }

    spawnCoin(index) {
        var spawnX = this.spawnPositions[index][0];
        var spawnY = this.spawnPositions[index][1];
        this.mapCoins[index] = {
            xPos: spawnX,
            yPos: spawnY
        };
        this.sendCoins(this.mapCoins, this.gameCode);
    }
    destroyCoin(index) {
        this.mapCoins[index] = null;
    }
    trySpawn() {
        var index = getRandom(0, _COINS - 1);
        if(this.mapCoins[index] == null) {
            this.spawnCoin(index);
        }
    }
}
exports.CoinsGenerator = CoinsGenerator;