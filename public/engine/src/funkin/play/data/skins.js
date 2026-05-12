// src/funkin/play/data/skins.js

class Skins {
    static preload(scene) {
        const pd = scene.playData;
        const skinName = pd.get('skins.ui', 'funkin');
        const jsonKey = 'skinData_' + skinName;

        if (scene.cache.json.exists(jsonKey)) {
            Skins.loadAssets(scene, scene.cache.json.get(jsonKey));
        } else {
            scene.load.json(jsonKey, Path.dataSkins + skinName + '.json');
            scene.load.once('filecomplete-json-' + jsonKey, (key, type, data) => {
                Skins.loadAssets(scene, data);
            });
        }
    }

    static loadAssets(scene, data) {
        const basePath = data?.global?.basePath || 'Funkin';

        const extract = (obj) => {
            if (!obj || typeof obj !== 'object') return;

            const assetPath = obj.path !== undefined ? obj.path : obj.assetPath;

            if (assetPath) {
                const ext = assetPath.match(/\.[0-9a-z]+$/i);
                let finalPath = assetPath;
                let isAudio = obj.volume !== undefined || assetPath.includes('sound');

                if (!ext) {
                    finalPath += isAudio ? '.ogg' : '.png';
                }

                const fullUrl = Path.skins + basePath + '/' + finalPath;

                // CORRECCIÓN: Llave única combinando basePath y assetPath
                const cacheKey = basePath + '_' + assetPath;

                if (isAudio) {
                    if (!scene.cache.audio.exists(cacheKey)) scene.load.audio(cacheKey, fullUrl);
                } else {
                    if (!scene.textures.exists(cacheKey)) scene.load.image(cacheKey, fullUrl);
                }
            }

            for (let k in obj) {
                if (typeof obj[k] === 'object') extract(obj[k]);
            }
        };

        extract(data);
    }

    constructor(scene) {
        this.scene = scene;
        this.skinName = scene.playData.get('skins.ui', 'funkin');
        this.data = scene.cache.json.get('skinData_' + this.skinName) || {};
        this.basePath = this.data?.global?.basePath || 'Funkin';
    }

    get(path, defaultValue = null) {
        if (!path) return this.data;
        const result = path.split('.').reduce((prev, curr) =>
            (prev && prev[curr] !== undefined) ? prev[curr] : undefined, this.data
        );
        return result !== undefined ? result : defaultValue;
    }

    // NUEVO: Método para obtener la llave exacta que usarás en scene.add.image()
    getKey(pathStr) {
        const assetPath = this.get(pathStr);
        if (!assetPath) return null;
        return this.basePath + '_' + assetPath;
    }

    update(time, delta) {
    }
}

window.Skins = Skins;
