// src/funkin/play/UI/arrows/notes/renderer.js

class Note extends Phaser.GameObjects.Sprite {
    constructor(scene, noteData, strumTarget) {
        const skins = scene.referee.skins;
        const atlasKey = skins.getKey('gameplay.notes.path') + '_XML';

        super(scene, 0, 0, atlasKey);
        scene.add.existing(this);

        this.noteData = noteData;
        this.strumTarget = strumTarget;
        this.direction = strumTarget.direction;

        this.skinData = skins.get('gameplay.notes');
        this.animPrefix = this.skinData.animations[this.direction];

        // Origen 0,0 como las strumlines
        this.setOrigin(0, 0);

        // Propiedades de escala y transparencia
        const scaleVal = this.skinData.scale !== undefined ? this.skinData.scale : 0.7;
        this.setScale(scaleVal);
        this.setAlpha(this.skinData.alpha !== undefined ? this.skinData.alpha : 1.0);

        this.createAnimations(atlasKey);

        const animKey = `${atlasKey}_note_${this.direction}`;
        if (this.scene.anims.exists(animKey)) {
            const firstFrame = this.scene.anims.get(animKey).frames[0].frame.name;
            this.setFrame(firstFrame);
        }

        // --- POSICIONAMIENTO DIRECTO (Sin auto-centrado) ---
        // Simplemente copiamos la posición base de la strumline objetivo
        this.baseOffsetX = this.strumTarget.baseX;
        this.targetY = this.strumTarget.baseY;

        // Añadimos los offsets personalizados del JSON si los tiene
        if (this.skinData.Offset) {
            this.baseOffsetX += this.skinData.Offset[0] || 0;
            this.targetY += this.skinData.Offset[1] || 0;
        }

        this.playAnim(animKey);
    }

    createAnimations(atlasKey) {
        const anims = this.scene.anims;
        const texture = this.scene.textures.get(atlasKey);
        if (!texture || texture.key === '__MISSING' || !this.animPrefix) return;

        const animKey = `${atlasKey}_note_${this.direction}`;
        if (anims.exists(animKey)) return;

        const allFrames = texture.getFrameNames();
        const validFrames = allFrames.filter(f => f.startsWith(this.animPrefix) || f.includes(this.animPrefix)).sort();

        if (validFrames.length > 0) {
            anims.create({
                key: animKey,
                frames: validFrames.map(f => ({ key: atlasKey, frame: f })),
                frameRate: 24,
                repeat: -1
            });
        }
    }

    playAnim(animKey) {
        if (this.scene.anims.exists(animKey)) {
            this.play(animKey, true);
        }
    }

    updatePos(songTime, scrollSpeed) {
        // La diferencia de tiempo actual
        const timeDiff = this.noteData.t - songTime;

        // Si tu songTime es negativo en el countdown, timeDiff será un número alto y currentY estará abajo en la pantalla
        const currentY = this.targetY + (timeDiff * 0.45 * scrollSpeed);

        this.setPosition(this.baseOffsetX, currentY);
    }
}

window.Note = Note;
