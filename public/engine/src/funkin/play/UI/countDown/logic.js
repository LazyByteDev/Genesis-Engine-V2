// src/funkin/play/UI/countDown/logic.js

class CountDownLogic {
    constructor(scene) {
        this.scene = scene;

        const bpm = this.scene.referee.song.bpm || 100;
        this.crochet = (60 / bpm) * 1000;

        this.renderer = new window.CountDownRenderer(this.scene, this.crochet);
        this.currentStep = 0;

        this.start();
    }

    start() {
        this.tick();
        this.timer = this.scene.time.addEvent({
            delay: this.crochet,
            callback: this.tick,
            callbackScope: this,
            repeat: 4
        });
    }

    tick() {
        if (this.currentStep < 4) {
            this.renderer.render(this.currentStep);
        } else if (this.currentStep === 4) {
            this.scene.events.emit('startSong');
            console.log("[CountDown] Conteo finalizado. Arrancando canción.");
        }
        this.currentStep++;
    }
}

window.CountDownLogic = CountDownLogic;
