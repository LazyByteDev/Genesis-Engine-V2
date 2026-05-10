// src/funkin/play/referee/init.js

class PlayReferee {
    constructor(scene) {
        this.scene = scene;

        // Instanciado en orden estricto
        this.skins = new window.Skins(this.scene);
        this.song = new window.Song(this.scene);
    }
}

window.PlayReferee = PlayReferee;
