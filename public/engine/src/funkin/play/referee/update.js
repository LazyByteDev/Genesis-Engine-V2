// src/funkin/play/referee/update.js

class PlayRefereeUpdate {
    static execute(referee, time, delta) {
        referee.skins.update(time, delta);
        referee.song.update(time, delta);
    }
}

window.PlayRefereeUpdate = PlayRefereeUpdate;
