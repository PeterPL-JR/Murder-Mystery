const fs = require("fs");
const {getRandom} = require("./functions");

const mapsObjs = []; // Mapy
let tiles = []; // // Obiekty kafelków

const MAPS = 4;
exports.MAPS = MAPS;

const MAPS_PATH = "resources/maps";
const TILES_PATH = "resources/tiles.json";

// Funkcja ładująca wszystkie mapy
exports.initMaps = function() {
    const filesNames = fs.readdirSync(MAPS_PATH);
    for(let fileName of filesNames) {
        initMap(fileName);
    }
}

// Funkcja tworząca pojedynczą mapę z pliku JSON
function initMap(fileName) {
    const fileData = fs.readFileSync(MAPS_PATH + "/" + fileName);
    const obj = JSON.parse(fileData);

    const mapName = obj.mapName;
    const tiles = obj.tiles;
    const spawn = obj.spawn;

    mapsObjs.push({
        name: mapName,
        data: tiles,
        spawn: spawn
    });
    exports.mapsObjs = mapsObjs;
}

// Funkcja ładująca kafelki z pliku JSON
exports.loadTiles = function() {
    const fileData = fs.readFileSync(TILES_PATH);
    const array = JSON.parse(fileData);
    tiles = array;
    exports.tiles = tiles;
}

exports.createRandPositions = function(room) {
    const mapObj = mapsObjs[room.map];
    const spawnPositions = Array.from(mapObj.spawn);
    const randPositions = [];

    for (let i = 0; i < room.players.length; i++) {
        const randPos = getRandom(0, spawnPositions.length - 1);
        const randX = spawnPositions[randPos][0];
        const randY = spawnPositions[randPos][1];

        randPositions[i] = { randX, randY };
        spawnPositions.splice(randPos, 1);
    }
    return randPositions;
}