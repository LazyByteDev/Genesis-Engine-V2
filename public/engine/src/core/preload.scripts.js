// --- EL TRUCO ---
// Creamos un motor temporal para atrapar los registros de escenas
// mientras los scripts se están descargando.
window.game = {
    _sceneQueue: [],
    scene: {
        add: function(key, sceneClass, autoStart) {
            window.game._sceneQueue.push({ key, sceneClass, autoStart });
        }
    }
};

async function loadScriptsOrderly() {
    try {
        const response = await fetch('src/core/preload.scripts.jsonc');
        const text = await response.text();
        
        // JSONC parser
        const cleanJson = text.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
        const scripts = JSON.parse(cleanJson);

        // Carga secuencial
        for (const src of scripts) {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = reject;
                document.getElementById('scripts-container').appendChild(script);
            });
        }

        await bootEngine();

    } catch (error) {
        console.error('Error al cargar scripts:', error);
    }
}

async function bootEngine() {
    if (typeof Neutralino !== 'undefined') {
        Neutralino.init();
    }

    if (typeof window.StoragePatch !== 'undefined') {
        await window.StoragePatch.init();
    }

    if (window.GenesisConfig) {
        // 1. Rescatamos las escenas atrapadas en la cola temporal
        const queuedScenes = window.game._sceneQueue || [];

        // 2. Sobrescribimos el game falso con el motor REAL de Phaser
        window.game = new Phaser.Game(window.GenesisConfig);

        // 3. Inyectamos todas las escenas al motor real
        queuedScenes.forEach(s => {
            window.game.scene.add(s.key, s.sceneClass, s.autoStart);
        });
        
    } else {
        console.error("GenesisConfig no definido.");
    }
}

loadScriptsOrderly();