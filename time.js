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
        this.interval = setInterval(change, ONE_SECOND);
    }
    stopTimer() {
        clearInterval(this.interval);
    }
    change() {
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

        this.string = this.minutes + ":" + ((this.seconds < 10) ? "0" + this.seconds : this.seconds);
        if(this.minutes == 0) {
            this.string = this.seconds + " sekund";
        }

        if(this.fun && this.fun != null) {
            this.fun(this.gameCode, this.string);
        }
    }
}

class LobbyTimer extends Timer {
    constructor(gameCode, fun, stopFun) {
        super(0, 0, gameCode, fun, stopFun);
    }
}
class GameTimer extends Timer {
    constructor(gameCode, fun, stopFun) {
        super(GAME_MINUTES, GAME_SECONDS, gameCode, fun, stopFun);
    }
}

exports.LobbyTimer = LobbyTimer;
exports.GameTimer = GameTimer;