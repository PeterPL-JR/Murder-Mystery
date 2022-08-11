const files = require("fs");

const mapsObjs = []; // Mapy
var tiles = []; // // Obiekty kafelków

const MAPS = 4;
exports.MAPS = MAPS;

// Nazwy map
const mapsNames = [
    "Tawerna", "Zamek", "Egipt", "Wyspy"
];
// Nazwy plików map
const mapsFilesNames = [
    "tavern", "castle", "eqypt", "islands"
];

// Funkcja ładująca wszystkie mapy
exports.initMaps = function() {
    for(var i = 0; i < MAPS; i++) {
        initMap(i);
    }
}

// Funkcja tworząca pojedynczą mapę z pliku JSON
function initMap(index) {
    var mapFileName = mapsFilesNames[index];
    var mapName = mapsNames[index];

    files.readFile("maps/map_" + mapFileName + ".json", "utf-8", function(error, data) {
        var obj = JSON.parse(data);
        mapsObjs.push({
            name: mapName,
            data: obj
        });
    });
    exports.mapsObjs = mapsObjs;
}

// Funkcja ładująca kafelki z pliku JSON
exports.loadTiles = function() {
    files.readFile("tiles.json", "utf-8", function(error, data) {
        var array = JSON.parse(data);
        tiles = array;
        exports.tiles = tiles;
    });
}