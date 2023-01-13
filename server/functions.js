// Funkcja wyszukująca gracza w tablicy na podstawie jego kodu
exports.findPlayerIndex = function(playersArray, code) {
    return playersArray.findIndex(function(obj) {
        return obj.player.playerCode == code;
    });
}
// Funkcja wyszukująca index gracza w tablicy na podstawie jego kodu
exports.findPlayer = function(playersArray, code) {
    return playersArray.find(function(obj) {
        return obj.player.playerCode == code;
    });
}

// Funkcja zwracająca losową liczbę z przedziału od MIN do MAX włącznie
exports.getRandom = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Funkcja wyszukująca gracza w pokoju na podstawie jego kodu
exports.findPlayerInRoom = function(room, playerCode) {
    let index = exports.findPlayerIndex(room.players, playerCode);
    return room.players[index];
}