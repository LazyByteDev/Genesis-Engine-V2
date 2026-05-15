// src/funkin/play/UI/arrows/strumlines/renderer.js

class Strum extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, direction, dirID) {
        const skins = scene.referee.skins;
        const atlasKey = skins.getKey('gameplay.strumline.path') + '_XML';

        super(scene, x, y, atlasKey);
        scene.add.existing(this);

        this.direction = direction;
        this.dirID = dirID;
        this.skinData = skins.get('gameplay.strumline');
        this.dirData = this.skinData.animations[direction];

        // NO SE TOCA EL ORIGEN
        this.setOrigin(0, 0);

        // Guardamos el X y Y "perfectos" (centros calculados por positions.js)
        this.targetX = x;
        this.targetY = y;

        const scaleVal = this.skinData.scale !== undefined ? this.skinData.scale : 0.7;
        this.setScale(scaleVal);
        this.setAlpha(this.skinData.alpha !== undefined ? this.skinData.alpha : 1.0);

        this.createAnimations(atlasKey);

        const staticAnimKey = `${atlasKey}_${this.direction}_static`;
        if (this.scene.anims.exists(staticAnimKey)) {
            const firstFrame = this.scene.anims.get(staticAnimKey).frames[0].frame.name;
            this.setFrame(firstFrame);
        }

        // CÁLCULO ORIGINAL MANTENIDO
        this.baseX = x - (this.width * scaleVal) / 2;
        this.baseY = y - (this.height * scaleVal) / 2;

        this.isHeld = false;
        this.currentState = 'static';
        this.playAnim('static');
    }

    // NUEVO: Método seguro para reescalar sin romper el Origin
    applyScale(newScale) {
        this.setScale(newScale);
        // Si el tamaño cambia (ej. a 0.4 en modo mini), recalculamos su base usando el centro exacto
        this.baseX = this.targetX - (this.width * newScale) / 2;
        this.baseY = this.targetY - (this.height * newScale) / 2;
        this.playAnim(this.currentState || 'static');
    }

    createAnimations(atlasKey) {
        const anims = this.scene.anims;
        const texture = this.scene.textures.get(atlasKey);
        if (!texture || texture.key === '__MISSING') return;

        ['static', 'press', 'confirm'].forEach(state => {
            const prefix = this.dirData[state];
            if (!prefix) return;

            const animKey = `${atlasKey}_${this.direction}_${state}`;
            if (anims.exists(animKey)) anims.remove(animKey);

            const validFrames = texture.getFrameNames().filter(f => f.startsWith(prefix) || f.includes(prefix)).sort();

            if (validFrames.length > 0) {
                anims.create({
                    key: animKey,
                    frames: validFrames.map(f => ({ key: atlasKey, frame: f })),
                    frameRate: 24,
                    repeat: state === 'static' ? -1 : 0
                });
            }
        });
    }

    playAnim(state) {
        const skins = this.scene.referee.skins;
        const atlasKey = skins.getKey('gameplay.strumline.path') + '_XML';
        const animKey = `${atlasKey}_${this.direction}_${state}`;

        if (!this.scene.anims.exists(animKey)) return;

        this.play(animKey, true);
        this.currentState = state;

        if (state === 'confirm') {
            this.once('animationcomplete', () => {
                if (this.isHeld) this.playAnim('press');
                else this.playAnim('static');
            });
        }

        if (state === 'press') {
            this.once('animationcomplete', () => {
                if (this.anims.currentAnim) {
                    const lastFrame = this.anims.currentAnim.frames[this.anims.currentAnim.frames.length - 1];
                    this.anims.pause(lastFrame);
                }
            });
        }

        // Ajuste dinámico proporcional de Offsets
        const jsonScale = this.skinData.scale !== undefined ? this.skinData.scale : 0.7;
        const ratio = this.scaleX / jsonScale;
        let offset = this.skinData.offsets[state] || [0, 0];

        this.setPosition(this.baseX + (offset[0] * ratio), this.baseY + (offset[1] * ratio));
    }

    update(time, delta) {}
}

window.Strum = Strum;
