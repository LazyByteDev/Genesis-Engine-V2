const pauseEngine = () => {
    console.log("Out Display...");
    
    // pause html media elements
    document.querySelectorAll('audio, video').forEach(media => { 
        media.muted = true; 
        media.pause(); 
    });
    
    // suspend context of all audio contexts (if any)
    if (window._audioContexts) {
        window._audioContexts.forEach(ctx => { if (ctx.state === 'running') ctx.suspend(); });
    }

    // off phaser
    if (window.game) {
        if (window.game.loop) window.game.loop.sleep();
        if (window.game.sound) {
            window.game.sound.mute = true;
            if (window.game.sound.context && window.game.sound.context.state === 'running') {
                window.game.sound.context.suspend();
            }
        }
    }
};

const resumeEngine = () => {
    console.log("On Display...");
    
    document.querySelectorAll('audio, video').forEach(media => { 
        media.muted = false; 
        media.play().catch(e => console.log("Autoplay bloqueado hasta toque", e)); 
    });
    
    if (window._audioContexts) {
        window._audioContexts.forEach(ctx => { if (ctx.state === 'suspended') ctx.resume(); });
    }

    if (window.game) {
        if (window.game.loop) window.game.loop.wake();
        if (window.game.sound) {
            window.game.sound.mute = false;
            if (window.game.sound.context && window.game.sound.context.state === 'suspended') {
                window.game.sound.context.resume();
            }
        }
    }
};

// detect react native
window.addEventListener('appBackground', pauseEngine);
window.addEventListener('appForeground', resumeEngine);

// detect changes
document.addEventListener("visibilitychange", () => {
    if (document.hidden || document.visibilityState === 'hidden') {
        pauseEngine();
    } else {
        resumeEngine();
    }
});