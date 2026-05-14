// src/funkin/play/referee/shutdown.js

class PlayRefereeShutdown {
    static execute(referee) {
        if (!referee) return;

        console.log("[Referee] Iniciando protocolo de apagado...");

        // 1. Detener Audio (Prioridad Máxima)
        if (referee.song && typeof referee.song.shutdown === 'function') {
            referee.song.shutdown();
        }

        // 2. Limpiar Lógicas y Eventos
        if (referee.strumlines && typeof referee.strumlines.shutdown === 'function') referee.strumlines.shutdown();
        if (referee.notesLogic && typeof referee.notesLogic.shutdown === 'function') referee.notesLogic.shutdown();
        if (referee.sustainLogic && typeof referee.sustainLogic.shutdown === 'function') referee.sustainLogic.shutdown();

        // ---> NUEVO: Apagar bot <---
        if (referee.bot && typeof referee.bot.shutdown === 'function') referee.bot.shutdown();

        if (referee.countdown && typeof referee.countdown.shutdown === 'function') referee.countdown.shutdown();

        // 3. Limpiar Cámaras y Stage
        if (referee.cameras && typeof referee.cameras.shutdown === 'function') referee.cameras.shutdown();
        if (referee.stage && typeof referee.stage.shutdown === 'function') referee.stage.shutdown();

        console.log("[Referee] Escena limpiada correctamente.");
    }
}

window.PlayRefereeShutdown = PlayRefereeShutdown;
