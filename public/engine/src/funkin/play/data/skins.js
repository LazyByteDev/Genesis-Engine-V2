// src/funkin/play/data/skins.js

class Skins {
    static preload(scene) {
        const pd = scene.playData;
        const skinName = pd.get('skins.ui', 'funkin');
        const jsonKey = 'skinData_' + skinName;

        // Si ya está en caché, cargamos los assets directamente
        if (scene.cache.json.exists(jsonKey)) {
            Skins.loadAssets(scene, scene.cache.json.get(jsonKey));
        } else {
            // Si no, cargamos el JSON y escuchamos a que termine para extraer los paths
            scene.load.json(jsonKey, Path.dataSkins + skinName + '.json');

            scene.load.once('filecomplete-json-' + jsonKey, (key, type, data) => {
                Skins.loadAssets(scene, data);
            });
        }
    }

    static loadAssets(scene, data) {
        const basePath = data?.global?.basePath || 'Funkin';

        // Función recursiva para buscar "path" o "assetPath" en todo el JSON
        const extract = (obj) => {
            if (!obj || typeof obj !== 'object') return;

            const assetPath = obj.path !== undefined ? obj.path : obj.assetPath;

            if (assetPath) {
                // Comprobamos si tiene extensión explícita (.jpg, .png, etc)
                const ext = assetPath.match(/\.[0-9a-z]+$/i);
                let finalPath = assetPath;

                // Heurística simple para saber si es audio o imagen
                let isAudio = obj.volume !== undefined || assetPath.includes('sound');

                if (!ext) {
                    finalPath += isAudio ? '.ogg' : '.png';
                }

                const fullUrl = Path.skins + basePath + '/' + finalPath;

                if (isAudio) {
                    if (!scene.cache.audio.exists(assetPath)) scene.load.audio(assetPath, fullUrl);
                } else {
                    if (!scene.cache.image.exists(assetPath)) scene.load.image(assetPath, fullUrl);
                }
            }

            // Escanear propiedades anidadas
            for (let k in obj) {
                if (typeof obj[k] === 'object') extract(obj[k]);
            }
        };

        extract(data);
        console.log(`[Skins] Assets puestos en cola para la skin base: ${basePath}`);
    }

    constructor(scene) {
        this.scene = scene;
        this.skinName = scene.playData.get('skins.ui', 'funkin');

        // Almacenamos el JSON crudo en memoria por si queremos consultar datos de offsets o escalas
        this.data = scene.cache.json.get('skinData_' + this.skinName) || {};
        this.basePath = this.data?.global?.basePath || 'Funkin';
    }

    /**
     * Acceso rápido a las propiedades del JSON (ej: get('gameplay.strumline.scale'))
     */
    get(path, defaultValue = null) {
        if (!path) return this.data;
        const result = path.split('.').reduce((prev, curr) =>
            (prev && prev[curr] !== undefined) ? prev[curr] : undefined, this.data
        );
        return result !== undefined ? result : defaultValue;
    }

    update(time, delta) {
        // Reservado para posibles lógicas animadas de la UI en el futuro
    }
}

window.Skins = Skins;
