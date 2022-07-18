// Funkcja ładująca pojedynczy obrazek
function createImage(path) {
    var image = document.createElement("img");
    image.src = "images/" + path;
    return image;
}

// Funkcja zwracająca losową liczbę z przedziału od MIN do MAX włącznie
function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}