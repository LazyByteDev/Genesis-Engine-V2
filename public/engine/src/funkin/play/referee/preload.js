// src/funkin/play/referee/preload.js

class PlayRefereePreload {
    static execute(scene) {
        window.Skins.preload(scene);
        window.Stage.preload(scene);
        window.Song.preload(scene);

        const songName = scene.playData.get('song', 'test');
        const chartPath = scene.playData.getChartPath();
        scene.load.json(`chart_${songName}`, chartPath);

        const skinName = scene.playData.get('skins.ui', 'funkin');
        const jsonKey = 'skinData_' + skinName;

        const loadAtlas = (data) => {
            const basePath = data?.global?.basePath || 'Funkin';

            // Texturas Strumline
            const strumPath = data.gameplay.strumline.path;
            const fullStrumKey = `${basePath}_${strumPath}`;
            scene.load.atlasXML(fullStrumKey + '_XML', `${window.Path.skins}${basePath}/${strumPath}.png`, `${window.Path.skins}${basePath}/${strumPath}.xml`);

            // Texturas Notas
            if (data.gameplay.notes && data.gameplay.notes.path) {
                const notePath = data.gameplay.notes.path;
                const fullNoteKey = `${basePath}_${notePath}`;
                scene.load.atlasXML(fullNoteKey + '_XML', `${window.Path.skins}${basePath}/${notePath}.png`, `${window.Path.skins}${basePath}/${notePath}.xml`);
            }
        };

        if (scene.cache.json.exists(jsonKey)) {
            loadAtlas(scene.cache.json.get(jsonKey));
        } else {
            scene.load.once(`filecomplete-json-${jsonKey}`, (k, t, data) => loadAtlas(data));
        }
    }
}

window.PlayRefereePreload = PlayRefereePreload;
