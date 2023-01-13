const fs = require("fs");
const { _MAX_PLAYERS } = require("../server");
const {getRandom} = require("./functions");

const HITBOXES_PATH = "resources/hitboxes.json";
const _COINS = _MAX_PLAYERS;

class CoinsGenerator {
    constructor(spawnPositions, gameCode, sendCoins) {
        this.mapCoins = [];

        this.sendCoins = sendCoins;
        this.spawnPositions = spawnPositions;
        this.gameCode = gameCode;
    }
    
    startGen() {
        this.initSpawn();
    }

    initSpawn() {
        for(let i = 0; i < _COINS; i++) {
            this.mapCoins[i] = null;
        }
        
        let trySpawn = this.trySpawn.bind(this);
        this.interval = setInterval(function() {
            trySpawn();
        }, 1000);
    }
    destroy() {
        clearInterval(this.interval);
    }

    spawnCoin(index) {
        let spawnX = this.spawnPositions[index][0];
        let spawnY = this.spawnPositions[index][1];
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
        let index = getRandom(0, _COINS - 1);
        if(this.mapCoins[index] == null) {
            this.spawnCoin(index);
        }
    }
}
exports.CoinsGenerator = CoinsGenerator;

function sendCoins(mapCoins, gameCode) {
    const {rooms} = require("../server");
    let socketsArray = rooms[gameCode].sockets;
    for (let socket of socketsArray) {
        socket.emit("update-coins", { mapCoins });
    }
}
function deleteCoin(data) {
    const {rooms} = require("../server");
    let gameCode = data.gameCode;
    let gen = rooms[gameCode].coinsGen;

    gen.destroyCoin(data.coinIndex);
    sendCoins(gen.mapCoins, gameCode);
}

exports.loadHitboxes = function() {
    const fileData = fs.readFileSync(HITBOXES_PATH);
    exports.hitboxes = JSON.parse(fileData);
}

exports.sendCoins = sendCoins;
exports.deleteCoin = deleteCoin;