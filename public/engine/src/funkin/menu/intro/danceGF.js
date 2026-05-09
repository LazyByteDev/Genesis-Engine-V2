class IntroDanceScene extends Phaser.Scene {
    constructor() {
        super({ key: 'introDance' });
        
        // Inicialización compacta de propiedades
        Object.assign(this, {
            logo: null, gf: null, titleText: null, danceLeft: false, transitioning: false, music: null,
            cheatActive: false, secretBuffer: [], secretSequence: ['UI_LEFT', 'UI_RIGHT', 'UI_LEFT', 'UI_RIGHT', 'UI_UP', 'UI_DOWN', 'UI_UP', 'UI_DOWN'],
            hueAngle: 0, gfColorMatrix: null, logoColorMatrix: null, confirmTimer: null, startedTransition: false
        });
    }

    preload() {
        // Carga de Atlas en una línea
        const loadAtlas = (k, f) => this.load.atlasXML(k, `${Path.menu}intro/${f}.png`, `${Path.menu}intro/${f}.xml`);
        loadAtlas('logoBumpin', 'logoBumpin');
        loadAtlas('gfDanceTitle', 'gfDanceTitle');
        loadAtlas('titleText', 'titleEnter');
        
        // Carga de Audios dinámica
        this.load.audio('confirmMenu', `${Path.sounds}menu/confirmMenu.ogg`);
        ['girlfriendsRingtone', 'freakyMenu'].forEach(m => this.load.audio(m, `${Path.music}${m}.ogg`));
    }

    create() {
        this.createAnimations();

        // Inicialización optimizada de la música
        this.music = this.sound.getAllPlaying().find(s => ['introMusic', 'freakyMenu'].includes(s.key)) || this.sound.add('freakyMenu', { loop: true });
        if (!this.music.isPlaying) this.music.play();

        this.cameras.main.flash(1000, 255, 255, 255);

        const { width: w, height: h } = this.scale;
        
        // Función helper para crear y posicionar sprites
        const makeSp = (key, anim, xPct, yPct) => {
            let s = this.add.sprite(0, 0, key).play(anim).setOrigin(0, 0);
            return s.setPosition((w * xPct) - (s.displayWidth / 2), (h * yPct) - (s.displayHeight / 2));
        };

        this.logo = makeSp('logoBumpin', 'logoBump', 0.24, 0.35);
        this.gf = makeSp('gfDanceTitle', 'gfDanceRight', 0.70, 0.50);
        
        this.titleText = this.add.sprite(0, 0, 'titleText').play('titleIdle').setOrigin(0, 0);

        // Actualización dinámica de posición encapsulada
        this.updateTitlePos = () => this.titleText.setPosition((w - this.titleText.displayWidth) / 2, (h * 0.85) - (this.titleText.displayHeight / 2));
        this.updateTitlePos();
        this.titleText.on('animationupdate', this.updateTitlePos);

        Conductor.events.on('beatHit', this.onBeatHit, this);
        this.inputListener = (e) => this.handleInput(e);
        window.addEventListener('keydown', this.inputListener);
        this.events.once('shutdown', this.shutdown, this);
    }

    update(time, delta) {
        if (this.music?.isPlaying) Conductor.update(this.music.seek * 1000);
        
        if (this.cheatActive) {
            this.hueAngle = (this.hueAngle + delta * 0.1) % 360;
            this.gfColorMatrix?.hue(this.hueAngle);
            this.logoColorMatrix?.hue(this.hueAngle);
        }
    }

    onBeatHit() {
        this.logo?.play('logoBump', true);
        this.gf?.play((this.danceLeft = !this.danceLeft) ? 'gfDanceLeft' : 'gfDanceRight', true);
    }

    createAnimations() {
        const getFrames = (k, p) => this.textures.get(k).getFrameNames().filter(f => f.startsWith(p)).sort().map(f => ({ key: k, frame: f }));
        this.anims.create({ key: 'logoBump', frames: getFrames('logoBumpin', 'logo bumpin'), frameRate: 24 });
        this.anims.create({ key: 'titleIdle', frames: getFrames('titleText', 'Press Enter to Begin'), frameRate: 24, repeat: -1 });
        this.anims.create({ key: 'titlePress', frames: getFrames('titleText', 'ENTER PRESSED'), frameRate: 24 });

        const texGf = this.textures.get('gfDanceTitle').getFrameNames().filter(f => f.startsWith('gfDance')).sort();
        const mapIdx = idxs => idxs.map(i => ({ key: 'gfDanceTitle', frame: texGf[i] || texGf[0] }));
        
        this.anims.create({ key: 'gfDanceLeft', frames: mapIdx([30, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]), frameRate: 24 });
        this.anims.create({ key: 'gfDanceRight', frames: mapIdx([15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29]), frameRate: 24 });
    }

    handleInput(e) {
        if (this.transitioning) return Controls.ACCEPT(e) && this.skipConfirmDelay();
        
        ['UI_LEFT', 'UI_RIGHT', 'UI_UP', 'UI_DOWN'].forEach(k => Controls[k](e) && this.checkSecretCode(k));
        if (Controls.ACCEPT(e)) this.confirmSelection();
    }

    checkSecretCode(key) {
        this.secretBuffer.push(key);
        if (this.secretBuffer.length > 8) this.secretBuffer.shift();
        if (!this.cheatActive && this.secretBuffer.join() === this.secretSequence.join()) this.activateSecret();
    }

    activateSecret() {
        this.cheatActive = true;
        this.cameras.main.flash(1000, 255, 255, 255);
        this.sound.play('confirmMenu');

        this.gfColorMatrix = this.gf.postFX?.addColorMatrix();
        this.logoColorMatrix = this.logo.postFX?.addColorMatrix();
        if (this.gf.anims) this.gf.anims.timeScale = 1.5;

        this.sound.stopAll();
        this.music = this.sound.add('girlfriendsRingtone', { loop: true, volume: 0 });
        this.music.play();
        this.tweens.add({ targets: this.music, volume: 1.0, duration: 4000 });
        Conductor.mapTimeChanges([new SongTimeChange(0, 160, 4, 4)]);
    }

    confirmSelection() {
        if (this.transitioning) return;
        this.transitioning = true;
        
        this.titleText.play('titlePress');
        this.cameras.main.flash(900, 255, 255, 255);
        this.sound.play('confirmMenu');

        // Si el código secreto está activo, apagamos el audio progresivamente
        if (this.cheatActive && this.music) {
            this.tweens.add({ targets: this.music, volume: 0, duration: 2500 });
        }

        // Se ajustó a 2.5 segundos (2500 ms)
        this.confirmTimer = this.time.delayedCall(2500, () => this.goToMainMenu());
    }

    skipConfirmDelay() {
        if (this.confirmTimer) {
            this.confirmTimer.remove();
            this.confirmTimer = null;
            this.goToMainMenu();
        }
    }

    goToMainMenu() {
        if (this.startedTransition) return;
        this.startedTransition = true;
        window.transitionTo(this, 'MainMenuScene');
    }

    shutdown() {
        Conductor.events.off('beatHit', this.onBeatHit, this);
        window.removeEventListener('keydown', this.inputListener);
    }
}

window.IntroDanceScene = IntroDanceScene;
window.game.scene.add('introDance', window.IntroDanceScene);