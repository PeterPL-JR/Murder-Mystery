function initKeyboard() {
    // Wykrywanie, kiedy klawisz został kliknięty
    document.body.onkeydown = function (event) {
        keyDown(event);
    }
    // Wykrywanie, kiedy klawisz został puszczony
    document.body.onkeyup = function (event) {
        keyUp(event);
    }
}
function initMouse() {
    // Wykrywanie, kiedy klawisz został kliknięty
    document.body.onmousedown = function (event) {
        mouseDown(event);
    }
    // Wykrywanie, kiedy klawisz został puszczony
    document.body.onmouseup = function (event) {
        mouseUp(event);
    }
    // Wykrywanie ruchu myszy
    document.body.onmousemove = function (event) {
        mouseMove(event);
    }
}

// Zdarzenia Klawiatury
function keyDown(event) {
    let key = event.key.toUpperCase();
    keys[key] = true;
    send();
}
function keyUp(event) {
    let key = event.key.toUpperCase();
    keys[key] = false;
    if (movingKeys.indexOf(key) != -1) {
        PLAYER.moving = false;
        PLAYER.movingTime = 0;
        PLAYER.movingIndex = -1;
        send();
    }
    if (key == "F") {
        SHOTGUN.shooting = false;
        SHOTGUN.leftButton = false;
        PLAYER.direction = SHOTGUN.shootingDirIndex;
        send();
    }
}

// Zdarzenia Myszy
function mouseDown(event) {
    if(!SHOTGUN.shooting && !PLAYER.dead && isPlayerReady() && event.button == 0) {
        swordAttack();
    }
    if (SHOTGUN.shooting && isPlayerReady() && event.button == 0) {
        SHOTGUN.leftButton = true;
        send();
    }
}
function mouseUp(event) {
    if (SHOTGUN.shooting && !PLAYER.dead && event.button == 0) {
        let mouseX = getMouseX(event);
        let mouseY = getMouseY(event);
        if(SHOTGUN.charged && SHOTGUN.leftButton) {
            if(PLAYER.role == ROLE_MURDERER) {
                throwSword(mouseX, mouseY);
            } else {
                shoot(mouseX, mouseY);
            }
        }
        SHOTGUN.leftButton = false;
        send();
    }
}
function mouseMove(event) {
    let mouseX = getMouseX(event);
    SHOTGUN.shootingDirIndex = (mouseX < WIDTH / 2) ? 1 : 0;
    
    if(SHOTGUN.shooting) {
        PLAYER.direction = SHOTGUN.shootingDirIndex;
    }
    send();
}

// Funkcje zwracające pozycję kursora na obiekcie <canvas>
function getMouseX(event) {
    return event.clientX - canvas.offsetLeft;
}
function getMouseY(event) {
    return event.clientY - canvas.offsetTop;
}