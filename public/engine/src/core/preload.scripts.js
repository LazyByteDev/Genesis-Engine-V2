async function loadScriptsOrderly() {
    try {
        const response = await fetch('src/core/preload.scripts.jsonc');
        const text = await response.text();
        
        const cleanJson = text.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
        const scripts = JSON.parse(cleanJson);

        for (const src of scripts) {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = reject;
                document.getElementById('scripts-container').appendChild(script);
            });
        }
    } catch (error) {
        console.error('Error al cargar preload.scripts.jsonc:', error);
    }
}

loadScriptsOrderly();