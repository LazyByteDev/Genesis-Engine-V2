// src/funkin/play/data/song.js

class Song {
    static preload(scene) {
        const pd = scene.playData;
        const path = Path.songs + pd.songId + '/song/';

        scene.load.audio('inst', path + pd.get('audio.instrumental.inst.file', 'Inst.ogg'));

        if (pd.get('audio.needsVoices', true)) {
            if (!pd.get('audio.multiVocal', false)) {
                scene.load.audio('voicesPlayer', path + 'Voices.ogg');
            } else {
                scene.load.audio('voicesPlayer', path + pd.get('audio.vocals.player.file', 'Voices-bf.ogg'));
                scene.load.audio('voicesOpp', path + pd.get('audio.vocals.opponent.file', 'Voices-pico.ogg'));
            }
        }
    }

    constructor(scene) {
        this.scene = scene;
        const pd = scene.playData;

        this.bpm = pd.get('audio.bpm', 100);
        this.origin = pd.origin; // Guardamos el origen (freeplay, etc)
        this.needsVoices = pd.get('audio.needsVoices', true);
        this.multiVocal = pd.get('audio.multiVocal', false);

        this.instTrack = null;
        this.playerTrack = null;
        this.opponentTrack = null;

        this.setupTracks();
        this.play();
    }

    setupTracks() {
        this.instTrack = this.scene.sound.add('inst');

        // Al terminar la canción, volvemos al origen
        this.instTrack.on('complete', () => {
            this.onSongEnd();
        });

        if (this.needsVoices) {
            this.playerTrack = this.scene.sound.add('voicesPlayer');
            if (this.multiVocal) this.opponentTrack = this.scene.sound.add('voicesOpp');
        }
    }

    play() {
        // Cambiar BPM en el Conductor al iniciar
        window.Conductor.mapTimeChanges([
            new window.SongTimeChange(0, this.bpm, 4, 4)
        ]);

        this.instTrack.play();
        if (this.playerTrack) this.playerTrack.play();
        if (this.opponentTrack) this.opponentTrack.play();

        console.log(`[Song] Iniciando: ${this.bpm} BPM`);
    }

    onSongEnd() {
        // Resetear BPM a 102
        window.Conductor.mapTimeChanges([
            new window.SongTimeChange(0, 102, 4, 4)
        ]);

        // Determinar escena de destino
        const target = this.origin === 'freeplay' ? 'FreeplayScene' : 'MainMenuScene';

        console.log(`[Song] Fin. Volviendo a ${target} y reseteando BPM.`);

        if (window.transitionTo) {
            window.transitionTo(this.scene, target);
        } else {
            this.scene.scene.start(target);
        }
    }

    update(time, delta) {
        if (!this.instTrack || !this.instTrack.isPlaying) return;

        // Actualizar posición del Conductor basada en la música
        window.Conductor.update(this.instTrack.seek * 1000);

        // Sincronización de voces
        const masterTime = this.instTrack.seek;
        if (this.playerTrack?.isPlaying && Math.abs(this.playerTrack.seek - masterTime) > 0.02) {
            this.playerTrack.seek = masterTime;
        }
        if (this.opponentTrack?.isPlaying && Math.abs(this.opponentTrack.seek - masterTime) > 0.02) {
            this.opponentTrack.seek = masterTime;
        }
    }
}

window.Song = Song;
