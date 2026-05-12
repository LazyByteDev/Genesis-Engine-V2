// src/funkin/play/referee/update.js

class PlayRefereeUpdate {
    static execute(referee, time, delta) {
        if (referee.cameras && referee.cameras.update) referee.cameras.update(time, delta);
        if (referee.skins && referee.skins.update) referee.skins.update(time, delta);
        if (referee.stage && referee.stage.update) referee.stage.update(time, delta);
        if (referee.song && referee.song.update) referee.song.update(time, delta);
        if (referee.strumlines && referee.strumlines.update) referee.strumlines.update(time, delta);

        // Llamado explícito a las Notas
        if (referee.notesLogic && referee.notesLogic.update) referee.notesLogic.update(time, delta);

        if (referee.countdown && referee.countdown.update) referee.countdown.update(time, delta);
    }
}

window.PlayRefereeUpdate = PlayRefereeUpdate;
