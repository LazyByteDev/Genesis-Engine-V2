class SoundTray {
    static init() {
        if (!window.HUD || typeof Controls === 'undefined') {
            requestAnimationFrame(() => SoundTray.init());
            return;
        }

        this.scene = window.HUD;
        
        let savedVol = localStorage.getItem('genesis_vol');
        this.vol = savedVol !== null ? parseFloat(savedVol) : 0.5;
        this.scene.sound.volume = this.vol;

        this.scene.load.audio('snd_volup', Path.sounds + 'menu/soundtray/Volup.ogg');
        this.scene.load.audio('snd_volmax', Path.sounds + 'menu/soundtray/VolMAX.ogg');
        this.scene.load.audio('snd_voldown', Path.sounds + 'menu/soundtray/Voldown.ogg');
        this.scene.load.start();

        window.addEventListener('keydown', (e) => this.handleKey(e));
    }

    static handleKey(e) {
        if (Controls.VOL_UP(e)) this.change(0.1);
        if (Controls.VOL_DOWN(e)) this.change(-0.1);
        if (Controls.VOL_MUTE(e)) {
            this.scene.sound.mute = !this.scene.sound.mute;
        }
    }

    static change(amount) {
        if (this.scene.sound.mute) this.scene.sound.mute = false;

        if (amount > 0) {
            if (this.vol >= 1.0) this.vol = 1.2;
            else this.vol += 0.1;
        } else {
            if (this.vol >= 1.2) this.vol = 0.9;
            else this.vol -= 0.1;
        }

        this.vol = Math.max(0, Math.min(1.2, parseFloat(this.vol.toFixed(1))));
        this.scene.sound.volume = this.vol;
        localStorage.setItem('genesis_vol', this.vol);

        if (this.vol >= 1.2) {
            this.scene.sound.play('snd_volmax');
        } else if (amount > 0) {
            this.scene.sound.play('snd_volup');
        } else {
            this.scene.sound.play('snd_voldown');
        }
    }
}

SoundTray.init();