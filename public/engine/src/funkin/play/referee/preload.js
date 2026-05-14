// src/funkin/play/referee/preload.js

class PlayRefereePreload {
  static execute(scene) {
    window.Skins.preload(scene);
    window.Stage.preload(scene);
    window.Song.preload(scene);

    const songName = scene.playData.get("song", "test");
    const chartPath = scene.playData.getChartPath();
    scene.load.json(`chart_${songName}`, chartPath);

    const jsonKey = scene.playData.skinJsonKey;

    const loadAtlas = (data) => {
      const basePath = data?.global?.basePath || "Funkin";
      const uniqueId = scene.playData.uniqueSkinId;
      const antialiasing = data?.global?.antialiasing !== false;

      const loadXML = (pathName) => {
        if (!pathName) return;
        const fullKey = `${basePath}_${pathName}_${uniqueId}_XML`;
        scene.load.atlasXML(
          fullKey,
          `${window.Path.skins}${basePath}/${pathName}.png`,
          `${window.Path.skins}${basePath}/${pathName}.xml`,
        );

        // Aplicar el Pixel Art global si se requiere
        scene.load.once("filecomplete-atlasxml-" + fullKey, () => {
          if (!antialiasing && scene.textures.exists(fullKey)) {
            scene.textures
              .get(fullKey)
              .setFilter(Phaser.Textures.FilterMode.NEAREST);
          }
        });
      };

      loadXML(data.gameplay?.strumline?.path);
      loadXML(data.gameplay?.notes?.path);
      loadXML(data.gameplay?.sustains?.path);
      loadXML(data.gameplay?.noteSplashes?.path);
    };

    if (scene.cache.json.exists(jsonKey)) {
      loadAtlas(scene.cache.json.get(jsonKey));
    } else {
      scene.load.once(`filecomplete-json-${jsonKey}`, (k, t, data) =>
        loadAtlas(data),
      );
    }
  }
}

window.PlayRefereePreload = PlayRefereePreload;
