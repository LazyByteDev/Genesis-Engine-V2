// src/funkin/play/referee/update.js

class PlayRefereeUpdate {
    static execute(referee, time, delta) {
        // Actualizamos primero los gráficos y entornos base
        if (referee.cameras && referee.cameras.update) referee.cameras.update(time, delta);
        if (referee.skins && referee.skins.update) referee.skins.update(time, delta);
        if (referee.stage && referee.stage.update) referee.stage.update(time, delta);
        if (referee.song && referee.song.update) referee.song.update(time, delta);

        // Actualizamos lógicas de gameplay
        if (referee.strumlines && referee.strumlines.update) referee.strumlines.update(time, delta);
        if (referee.notesLogic && referee.notesLogic.update) referee.notesLogic.update(time, delta);
        if (referee.sustainLogic && referee.sustainLogic.update) referee.sustainLogic.update(time, delta);

        // El bot siempre va después de las notas
        if (referee.bot && referee.bot.update) referee.bot.update(time, delta);

        if (referee.countdown && referee.countdown.update) referee.countdown.update(time, delta);
    }
}

window.PlayRefereeUpdate = PlayRefereeUpdate;
