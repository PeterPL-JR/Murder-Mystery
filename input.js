function initKeyboard() {
    // Wykrywanie, kiedy klawisz został kliknięty
    document.body.onkeydown = function (event) {
        var key = event.key.toUpperCase();
        keys[key] = true;
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
        }
    }
}

function initMouse() {
    canvas.onmousedown = function (event) {
        if (shooting && event.button == 0) {
            leftButton = true;
        }
    }
    canvas.onmouseup = function (event) {
        if (shooting && event.button == 0) {
            leftButton = false;

            var mouseX = getMouseX(event);
            var mouseY = getMouseY(event);
            if(charged) {
                shoot(mouseX, mouseY);
                fireRateTime = 0;
            }
        }
    }
    canvas.onmousemove = function (event) {
        var mouseX = getMouseX(event);
        shootingIndex = (mouseX < WIDTH / 2) ? 1 : 0;
        
        if(shooting) {
            direction = shootingIndex;
        }
    }
}

function getMouseX(event) {
    return event.clientX - canvas.offsetLeft;
}
function getMouseY(event) {
    return event.clientY - canvas.offsetTop;
}