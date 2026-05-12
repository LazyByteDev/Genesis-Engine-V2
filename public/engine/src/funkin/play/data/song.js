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
        this.origin = pd.origin;
        this.needsVoices = pd.get('audio.needsVoices', true);
        this.multiVocal = pd.get('audio.multiVocal', false);

        this.instTrack = null;
        this.playerTrack = null;
        this.opponentTrack = null;

        // Configurar pistas en memoria
        this.setupTracks();

        // NUEVO: Escuchamos el evento del CountDown para reproducir
        this.scene.events.once('startSong', () => {
            this.play();
        });
    }

    setupTracks() {
        this.instTrack = this.scene.sound.add('inst');

        this.instTrack.on('complete', () => {
            this.onSongEnd();
        });

        if (this.needsVoices) {
            this.playerTrack = this.scene.sound.add('voicesPlayer');
            if (this.multiVocal) this.opponentTrack = this.scene.sound.add('voicesOpp');
        }
    }

    play() {
        window.Conductor.mapTimeChanges([
            new window.SongTimeChange(0, this.bpm, 4, 4)
        ]);

        this.instTrack.play();
        if (this.playerTrack) this.playerTrack.play();
        if (this.opponentTrack) this.opponentTrack.play();

        console.log(`[Song] Iniciando: ${this.bpm} BPM`);
    }

    onSongEnd() {
        window.Conductor.mapTimeChanges([
            new window.SongTimeChange(0, 102, 4, 4)
        ]);

        const target = this.origin === 'freeplay' ? 'FreeplayScene' : 'MainMenuScene';
        if (window.transitionTo) {
            window.transitionTo(this.scene, target);
        } else {
            this.scene.scene.start(target);
        }
    }

    update(time, delta) {
        if (!this.instTrack || !this.instTrack.isPlaying) return;

        window.Conductor.update(this.instTrack.seek * 1000);

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
