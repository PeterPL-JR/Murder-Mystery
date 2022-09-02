function initKeyboard() {
    // Wykrywanie, kiedy klawisz został kliknięty
    document.body.onkeydown = function (event) {
        var key = event.key.toUpperCase();
        keys[key] = true;
        send();
    }
    // Wykrywanie, kiedy klawisz został puszczony
    document.body.onkeyup = function (event) {
        var key = event.key.toUpperCase();
        keys[key] = false;
        if (movingKeys.indexOf(key) != -1) {
            moving = false;
            movingTime = 0;
            movingIndex = -1;
            send();
        }
        if (key == "F") {
            shooting = false;
            leftButton = false;
            send();
        }
    }
}

function initMouse() {
    document.body.onmousedown = function (event) {
        if(!shooting && !dead && event.button == 0) {
            attack();
        }
        if (shooting && isPlayerReady() && event.button == 0) {
            leftButton = true;
            send();
        }
    }
    document.body.onmouseup = function (event) {
        if (shooting && !dead && event.button == 0) {
            var mouseX = getMouseX(event);
            var mouseY = getMouseY(event);
            if(charged && leftButton) {
                shoot(mouseX, mouseY);
                fireRateTime = 0;
            }
            leftButton = false;
            send();
        }
    }
    document.body.onmousemove = function (event) {
        var mouseX = getMouseX(event);
        shootingDirIndex = (mouseX < WIDTH / 2) ? 1 : 0;
        
        if(shooting) {
            direction = shootingDirIndex;
        }
        send();
    }
}

function getMouseX(event) {
    return event.clientX - canvas.offsetLeft;
}
function getMouseY(event) {
    return event.clientY - canvas.offsetTop;
}