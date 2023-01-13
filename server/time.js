const LOBBY_MINUTES = 1;
const LOBBY_SECONDS = 30;

const GAME_MINUTES = 1;
const GAME_SECONDS = 0;

class Timer {
    constructor(minutes, seconds, gameCode, fun, stopFun) {
        this.minutes = minutes;
        this.seconds = seconds;
        this.gameCode = gameCode;

        this.fun = fun;
        this.stopFun = stopFun;
    }
    startTimer() {
        const ONE_SECOND = 1000;
        const change = this.change.bind(this);

        this.toString();
        this.invoke();
        this.interval = setInterval(change, ONE_SECOND);
    }
    setSeconds(seconds) {
        this.seconds = seconds;
    }
    setMinutes(minutes) {
        this.minutes = minutes;
    }
    stopTimer() {
        if(this.interval && this.interval != null) {
            clearInterval(this.interval);
        }
    }
    change() {
        if(this.suspended) {
            return;
        }

        this.seconds--;
        if(this.seconds < 0) {
            this.seconds = 59;
            this.minutes--;
        }
        if(this.minutes < 0) {
            this.stopTimer();
            if(this.stopFun && this.stopFun != null) {
                this.stopFun(this.gameCode);
            }
            return;
        }

        this.toString();
        this.invoke();
    }
    toString() {
        this.string = this.minutes + ":" + ((this.seconds < 10) ? "0" + this.seconds : this.seconds);
        if(this.minutes == 0) {
            this.string = this.seconds + " sekund";
        }
    }
    invoke() {
        if(this.fun && this.fun != null) {
            const {rooms} = require("../server");
            this.fun(rooms[this.gameCode], this.string);
        }
    }
    suspend() {
        this.suspended = true;
    }
    resume() {
        this.suspended = false;
    }
}

class LobbyTimer extends Timer {
    constructor(gameCode, stopFun) {
        super(LOBBY_MINUTES, LOBBY_SECONDS, gameCode, sendLobbyTime, stopFun);
    }
    changePlayers(players) {
        if(players < 4) {
            this.suspend();
            this.string = "Czekamy...";
            this.setMinutes(LOBBY_MINUTES);
            this.setSeconds(LOBBY_SECONDS);
            this.invoke();
        }
        if(players >= 4 && players <= 6) {
            this.setTime(LOBBY_MINUTES, LOBBY_SECONDS);
        }
        if(players >= 7 && players <= 11) {
            this.setTime(0, 30)
        }
        if(players >= 12) {
            this.setTime(0, 10);
        }
    }
    setTime(minutes, seconds) {
        this.resume();
        if(this.minutes * 60 + this.seconds > minutes * 60 + seconds) {
            this.setMinutes(minutes);
            this.setSeconds(seconds);
        }
        this.toString();
        this.invoke();
    }
}
class GameTimer extends Timer {
    constructor(gameCode, stopFun) {
        super(GAME_MINUTES, GAME_SECONDS, gameCode, sendGameTime, stopFun);
    }
}

function sendLobbyTime(room, timeString) {
    for (let socket of room.sockets) {
        socket.emit("lobby-time", { timeString });
    }
}
function sendGameTime(room, timeString) {
    for (let socket of room.sockets) {
        socket.emit("game-time", { timeString });
    }
}

exports.LobbyTimer = LobbyTimer;
exports.GameTimer = GameTimer;