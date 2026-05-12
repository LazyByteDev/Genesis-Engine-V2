// src/funkin/play/referee/shutdown.js

class PlayRefereeShutdown {
    static execute(referee) {
        if (referee.cameras && referee.cameras.shutdown) referee.cameras.shutdown();
        if (referee.skins && referee.skins.shutdown) referee.skins.shutdown();
        if (referee.stage && referee.stage.shutdown) referee.stage.shutdown();
        if (referee.song && referee.song.shutdown) referee.song.shutdown();
        if (referee.strumlines && referee.strumlines.shutdown) referee.strumlines.shutdown();

        // Limpieza de las notas
        if (referee.notesLogic && referee.notesLogic.shutdown) referee.notesLogic.shutdown();

        if (referee.countdown && referee.countdown.shutdown) referee.countdown.shutdown();
    }
}

window.PlayRefereeShutdown = PlayRefereeShutdown;
