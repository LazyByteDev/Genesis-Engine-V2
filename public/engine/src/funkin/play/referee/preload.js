// src/funkin/play/referee/preload.js

class PlayRefereePreload {
    static execute(scene) {
        window.Skins.preload(scene);
        window.Song.preload(scene);
    }
}

window.PlayRefereePreload = PlayRefereePreload;
