class PlayLoad {
    constructor(scene) {
        this.scene = scene;
        
        // Obtenemos los datos inyectados previamente en el Registry global
        this.data = this.scene.registry.get('playLoadData');
        
        // Fallback por si inicias la escena directamente (debug)
        if (!this.data) {
            console.warn("[PlayLoad] No se encontraron datos. Usando fallback de prueba.");
            this.data = {
                CurrentSong: "tutorial",
                SceneOrigin: "freeplay",
                isMultiplayer: false,
                Difficulty: "normal",
                Playlist: ["tutorial"],
                ScoreWeek: 0
            };
        }

        console.log(`[PlayLoad] Datos de la partida listos:`, this.data);
    }

    get(path) {
        if (!path) return this.data;
        return path.split('.').reduce((prev, curr) => 
            (prev && prev[curr] !== undefined) ? prev[curr] : undefined, this.data
        );
    }

    meta(path) {
        const songID = this.get('CurrentSong');
        if (!songID || !window.DataSongs) {
            console.warn("[PlayLoad] Error: DataSongs o CurrentSong no disponibles.");
            return null;
        }
        return window.DataSongs.getSongMeta(songID, path);
    }
}

// Inyección al objeto window
window.PlayLoad = PlayLoad;