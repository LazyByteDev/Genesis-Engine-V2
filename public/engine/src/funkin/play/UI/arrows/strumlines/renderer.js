// src/funkin/play/UI/arrows/strumlines/renderer.js

class Strum extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, direction, dirID) {
        const skins = scene.referee.skins;
        const atlasKey = skins.getKey('gameplay.strumline.path') + '_XML';

        super(scene, x, y, atlasKey);

        // Agrega el sprite a la escena
        scene.add.existing(this);

        this.direction = direction;
        this.dirID = dirID;
        this.skinData = skins.get('gameplay.strumline');
        this.dirData = this.skinData.animations[direction];

        // Origen en 0,0 como solicitaste
        this.setOrigin(0, 0);

        // Aplicamos la escala y el alpha desde el JSON (con valores seguros por defecto)
        const scaleVal = this.skinData.scale !== undefined ? this.skinData.scale : 0.7;
        this.setScale(scaleVal);
        this.setAlpha(this.skinData.alpha !== undefined ? this.skinData.alpha : 1.0);

        // Creamos las animaciones
        this.createAnimations(atlasKey);

        // Forzamos el frame estático un momento para medir sus dimensiones reales
        const staticAnimKey = `${atlasKey}_${this.direction}_static`;
        if (this.scene.anims.exists(staticAnimKey)) {
            const firstFrame = this.scene.anims.get(staticAnimKey).frames[0].frame.name;
            this.setFrame(firstFrame);
        }

        // LA MAGIA: Contrarrestamos el origen 0,0 restando la mitad de la textura escalada.
        // Esto mantiene el centro visual exactamente donde le pedimos (x, y).
        this.baseX = x - (this.width * scaleVal) / 2;
        this.baseY = y - (this.height * scaleVal) / 2;

        // Arrancamos el comportamiento
        this.playAnim('static');
    }

    createAnimations(atlasKey) {
        const anims = this.scene.anims;
        const texture = this.scene.textures.get(atlasKey);

        if (!texture || texture.key === '__MISSING') return;

        const allFrames = texture.getFrameNames();

        ['static', 'press', 'confirm'].forEach(state => {
            const prefix = this.dirData[state];
            if (!prefix) return;

            const animKey = `${atlasKey}_${this.direction}_${state}`;
            if (anims.exists(animKey)) anims.remove(animKey);

            const validFrames = allFrames.filter(f => f.startsWith(prefix) || f.includes(prefix)).sort();

            if (validFrames.length > 0) {
                const framesArray = validFrames.map(f => ({ key: atlasKey, frame: f }));
                anims.create({
                    key: animKey,
                    frames: framesArray,
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

        if (!this.scene.anims.exists(animKey)) {
            if (state !== 'static') this.playAnim('static');
            return;
        }

        // Reproduce hacia adelante (se quitó la lógica en reversa)
        this.play(animKey, true);

        if (state === 'press') {
            this.once('animationcomplete', () => {
                if (this.anims.currentAnim) {
                    const lastFrame = this.anims.currentAnim.frames[this.anims.currentAnim.frames.length - 1];
                    this.anims.pause(lastFrame);
                }
            });
        }

        // Aplicamos el offset extraído del JSON
        let offset = [0, 0];
        if (this.skinData.offsets && this.skinData.offsets[state]) {
            offset = this.skinData.offsets[state];
        }

        // Sumamos la posición corregida + el offset del JSON
        this.setPosition(this.baseX + offset[0], this.baseY + offset[1]);
    }

    update(time, delta) {
        // Reservado por si las notas en un futuro necesitan actualizar partículas o efectos
    }
}

window.Strum = Strum;
