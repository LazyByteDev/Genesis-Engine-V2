class FreeplayScene extends Phaser.Scene {
    constructor() {
        super({ key: 'FreeplayScene' });
        
        Object.assign(this, {
            songsData: [], // Almacena { displayName, trackID, difficulties }
            grpSongs: [],
            selectedIndex: 0,
            curSelectedFloat: 0, 
            curDiffIndex: 0,
            canInteract: false,
            music: null,
            score: 0
        });
    }

    preload() {
        this.load.image('menuBG', Path.menuBG + 'menuBG.png');
        Alphabet.load(this);

        this.load.audio('scrollMenu', Path.sounds + 'menu/scrollMenu.ogg');
        this.load.audio('confirmMenu', Path.sounds + 'menu/confirmMenu.ogg');
        this.load.audio('cancelMenu', Path.sounds + 'menu/cancelMenu.ogg');
        this.load.audio('freakyMenu', Path.music + 'freakyMenu.ogg');
    }

    create() {
        const { width: w, height: h } = this.scale;

        this.add.image(w / 2, h / 2, 'menuBG').setScale(1.2).setScrollFactor(0).setDepth(0);

        this.music = this.sound.getAllPlaying().find(s => ['introMusic', 'freakyMenu'].includes(s.key)) || this.sound.add('freakyMenu', { loop: true });
        if (!this.music.isPlaying) this.music.play();

        Alphabet.createAtlas(this);

        // --- RECOLECCIÓN DINÁMICA ---
        DataSongs.weeksList.forEach(weekName => {
            const weekData = DataSongs.getWeekData(weekName);
            if (weekData) {
                const tracks = weekData.songs || weekData.tracks || [];
                tracks.forEach(trackInfo => {
                    let rawName = Array.isArray(trackInfo) ? trackInfo[0] : trackInfo;
                    const trackID = rawName.toLowerCase().replace(/\s+/g, '-');
                    
                    let displayName = DataSongs.getSongMeta(trackID, 'songName') || rawName;
                    
                    // Extraer las dificultades del objeto JSON de los metadatos
                    let metaDiffs = DataSongs.getSongMeta(trackID, 'difficulties');
                    let diffs = [];
                    
                    if (metaDiffs && typeof metaDiffs === 'object' && !Array.isArray(metaDiffs)) {
                        // Si es un objeto (ej: {"easy":{}, "normal":{}}), sacamos las claves
                        diffs = Object.keys(metaDiffs);
                    } else if (Array.isArray(metaDiffs) && metaDiffs.length > 0) {
                        // Respaldo por si en el futuro se usa como array
                        diffs = metaDiffs;
                    } else {
                        // Fallback predeterminado
                        diffs = ['easy', 'normal', 'hard'];
                    }
                    
                    this.songsData.push({ 
                        displayName: displayName, 
                        trackID: trackID, 
                        difficulties: diffs 
                    });
                });
            }
        });

        if (this.songsData.length === 0) {
            console.warn("[Genesis] No se encontraron canciones. Creando fallback.");
            this.songsData.push({
                displayName: "NO SONGS\\nFOUND",
                trackID: "none",
                difficulties: ['normal']
            });
        }

        // --- GENERACIÓN DE LISTA ---
        const basePosX = w * 0.1;
        const basePosY = h / 2;

        this.songsData.forEach((data, i) => {
            let songContainer = this.add.container(basePosX, (i * 130) + basePosY);
            
            let lines = data.displayName.split('\\n');
            lines.forEach((line, lineIdx) => {
                let alphabetLine = new Alphabet(this, 0, lineIdx * 60, line.toUpperCase(), true);
                songContainer.add(alphabetLine);
            });

            this.add.existing(songContainer);
            songContainer.setDepth(10);
            this.grpSongs.push(songContainer);
        });

        // --- UI DE DIFICULTAD Y SCORE ---
        this.uiCont = this.add.container(w, 0).setScrollFactor(0).setDepth(20);

        // Recuadro simplificado (sin bordes redondeados ni delineados complejos)
        let bgUI = this.add.graphics();
        bgUI.fillStyle(0x000000, 0.7);
        bgUI.fillRect(-280, 0, 280, 120);
        this.uiCont.add(bgUI);

        this.diffText = this.add.text(-140, 35, '< NORMAL >', {
            fontFamily: 'vcr',
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.scoreText = this.add.text(-140, 80, 'SCORE: 0', {
            fontFamily: 'vcr',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.uiCont.add([this.diffText, this.scoreText]);

        this.changeSelection(0, false);
        this.canInteract = true;
        this.setupInputs();
        this.events.once('shutdown', this.cleanup, this);
    }

    update(time, delta) {
        if (this.music?.isPlaying) Conductor.update(this.music.seek * 1000);

        const dt = delta / 1000;
        this.curSelectedFloat = Phaser.Math.Linear(this.curSelectedFloat, this.selectedIndex, dt * 10);

        const basePosX = this.scale.width * 0.1;
        const basePosY = this.scale.height / 2;

        this.grpSongs.forEach((item, i) => {
            let indexDiff = i - this.curSelectedFloat;
            let targetY = (indexDiff * 130) + basePosY;
            let targetX = (Math.sin(indexDiff) * 60) + basePosX;

            if (i !== this.selectedIndex) targetX += 30;

            item.x = Phaser.Math.Linear(item.x, targetX, dt * 10);
            item.y = Phaser.Math.Linear(item.y, targetY, dt * 10);
            item.alpha = (i === this.selectedIndex) ? 1 : 0.6;
        });
    }

    setupInputs() {
        this.inputListener = (e) => {
            if (!this.canInteract) return;

            if (Controls.UI_UP(e)) this.changeSelection(-1);
            else if (Controls.UI_DOWN(e)) this.changeSelection(1);
            else if (Controls.UI_LEFT(e)) this.changeDiff(-1);
            else if (Controls.UI_RIGHT(e)) this.changeDiff(1);
            else if (Controls.ACCEPT(e)) this.confirmSelection();
            else if (Controls.BACK(e)) this.goBack();
        };
        window.addEventListener('keydown', this.inputListener);

        this.input.on('wheel', (p, go, dx, dy) => {
            if (this.canInteract) this.changeSelection(dy > 0 ? 1 : -1);
        });
    }

    changeSelection(change, playSound = true) {
        if (change !== 0 && playSound) this.sound.play('scrollMenu');
        this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + change, 0, this.songsData.length);
        
        this.curDiffIndex = 0;
        this.updateDiffUI();
    }

    changeDiff(change) {
        const diffs = this.songsData[this.selectedIndex].difficulties;
        if (diffs.length <= 1) return;

        this.sound.play('scrollMenu');
        this.curDiffIndex = Phaser.Math.Wrap(this.curDiffIndex + change, 0, diffs.length);
        this.updateDiffUI();
    }

    updateDiffUI() {
        if (this.songsData.length === 0) return;
        
        const data = this.songsData[this.selectedIndex];
        const diffName = data.difficulties[this.curDiffIndex] || 'NORMAL';
        
        this.diffText.setText('< ' + diffName.toUpperCase() + ' >');
        this.scoreText.setText('SCORE: ' + this.score);
    }

    confirmSelection() {
        this.canInteract = false;
        this.sound.play('confirmMenu');

        this.time.addEvent({
            delay: 60,
            repeat: 10,
            callback: () => {
                let target = this.grpSongs[this.selectedIndex];
                target.alpha = (target.alpha === 1) ? 0 : 1;
            },
            onComplete: () => {
                this.grpSongs[this.selectedIndex].alpha = 1;
                this.executeTransition();
            }
        });
    }

    executeTransition() {
        const data = this.songsData[this.selectedIndex];
        const diff = data.difficulties[this.curDiffIndex] || 'NORMAL';
        console.log(`[Genesis] Play: ${data.trackID} | Diff: ${diff}`);
        
        this.time.delayedCall(500, () => { this.canInteract = true; });
    }

    goBack() {
        this.canInteract = false;
        this.sound.play('cancelMenu');
        window.transitionTo(this, 'MainMenuScene');
    }

    cleanup() {
        window.removeEventListener('keydown', this.inputListener);
    }
}

window.FreeplayScene = FreeplayScene;
window.game.scene.add('FreeplayScene', window.FreeplayScene);