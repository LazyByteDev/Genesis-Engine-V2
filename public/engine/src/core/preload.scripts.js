/**
 * Genesis Engine - Script Preloader
 */

window.game = {
  _sceneQueue: [],
  scene: {
    add: function (key, sceneClass, autoStart) {
      window.game._sceneQueue.push({ key, sceneClass, autoStart });
    },
  },
};

async function loadScriptsOrderly() {
  try {
    const prefix = window.isReactNative ? "/engine/" : "";
    console.log(
      `[Genesis Preloader] Buscando config en: ${prefix}src/core/preload.scripts.jsonc`,
    );

    const response = await fetch(prefix + "src/core/preload.scripts.jsonc");

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status} al buscar el .jsonc`);
    }

    const text = await response.text();
    const cleanJson = text.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");
    const scripts = JSON.parse(cleanJson);

    for (const src of scripts) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = prefix + src;
        script.onload = resolve;
        script.onerror = () => {
          // Texto directo para que el logger no lo pierda
          reject(`Archivo no encontrado o bloqueado: ${prefix + src}`);
        };
        document.getElementById("scripts-container").appendChild(script);
      });
    }

    await bootEngine();
  } catch (error) {
    // Concatenamos el error en un solo string
    console.error("Falló la secuencia de carga -> " + (error.message || error));
  }
}

async function bootEngine() {
  // 1. CONDICIÓN CLAVE: Solo inicializamos Neutralino si NO estamos en React Native
  if (typeof Neutralino !== "undefined" && !window.isReactNative) {
    Neutralino.init();
    console.log("[Genesis] Neutralino inicializado (Modo PC).");
  } else if (window.isReactNative) {
    console.log("[Genesis] Neutralino ignorado (Modo React Native).");
  }

  // 2. Parches de almacenamiento
  if (typeof window.StoragePatch !== "undefined") {
    await window.StoragePatch.init();
  }

  // 3. Inicialización de Phaser
  if (window.GenesisConfig) {
    const queuedScenes = window.game._sceneQueue || [];
    window.game = new Phaser.Game(window.GenesisConfig);

    queuedScenes.forEach((s) => {
      window.game.scene.add(s.key, s.sceneClass, s.autoStart);
    });

    console.log(
      `[Genesis] Boot completado. ${queuedScenes.length} escenas inyectadas.`,
    );
  } else {
    console.error("[Genesis] Error Fatal: GenesisConfig no está definido.");
  }
}

loadScriptsOrderly();
