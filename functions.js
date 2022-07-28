// Funkcja wyszukująca gracza w tablicy na podstawie jego kodu
exports.findPlayerIndex = function(room, code) {
    return room.findIndex(function(obj) {
        return obj.playerCode == code;
    });
}
// Funkcja wyszukująca index gracza w tablicy na podstawie jego kodu
exports.findPlayer = function(room, code) {
    return room.find(function(obj) {
        return obj.playerCode == code;
    });
}

// Funkcja zwracająca losową liczbę z przedziału od MIN do MAX włącznie
exports.getRandom = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}