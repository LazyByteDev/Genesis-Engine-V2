// src/funkin/play/referee/init.js

class PlayReferee {
    constructor(scene) {
        this.scene = scene;
        this.scene.referee = this;

        this.cameras = new window.Cameras(this.scene);
        this.skins = new window.Skins(this.scene);

        this.chart = new window.Chart(this.scene);

        this.stage = new window.Stage(this.scene);
        this.song = new window.Song(this.scene);

        // Interfaz y Jugabilidad
        this.strumlines = new window.StrumlineLogic(this.scene);

        // Instancia orquestadora de Notas (Requiere que chart y strumlines ya existan)
        this.notesLogic = new window.NoteLogic(this.scene);

        this.countdown = new window.CountDownLogic(this.scene);
    }
}

window.PlayReferee = PlayReferee;
