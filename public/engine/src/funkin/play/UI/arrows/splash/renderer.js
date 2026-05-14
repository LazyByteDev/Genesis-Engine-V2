// src/funkin/play/UI/arrows/splash/renderer.js

class NoteSplash extends Phaser.GameObjects.Sprite {
  constructor(scene) {
    const skins = scene.referee.skins;
    const atlasKey = skins.getKey("gameplay.noteSplashes.path") + "_XML";
    super(scene, 0, 0, atlasKey);

    this.setOrigin(0, 0);
    this.setDepth(200);
    this.scene.add.existing(this);

    // ASIGNACIÓN CRÍTICA A LA CÁMARA UI
    if (this.scene.referee.cameras) {
      this.scene.referee.cameras.add(this, "ui");
    }

    this.on("animationcomplete", () => {
      this.setVisible(false);
      this.setActive(false);
    });
  }

  spawn(x, y, direction, skinData) {
    const anims = skinData.animations[direction];
    if (!anims) return;

    const animToPlay = anims[Math.floor(Math.random() * anims.length)];
    if (!this.scene.anims.exists(animToPlay)) return;

    this.setActive(true);
    this.setVisible(true);
    this.setAlpha(skinData.alpha || 1);
    this.setScale(skinData.scale || 1);

    // Aplicar ChromaKey si tu skin de Pixel lo requiere
    if (skinData.chromaKey && window.StageProps) {
      window.StageProps.applyChromaKey(
        this,
        skinData.chromaKey.color || skinData.chromaKey,
      );
    }

    this.play(animToPlay);

    // CÁLCULO DE CENTRO (Compensando el origen 0,0)
    // Esto hace que el centro del dibujo coincida con el centro de la flecha
    const visualWidth = this.width * this.scaleX;
    const visualHeight = this.height * this.scaleY;

    const offX = skinData.Offset ? skinData.Offset[0] : 0;
    const offY = skinData.Offset ? skinData.Offset[1] : 0;

    this.setPosition(x - visualWidth / 2 + offX, y - visualHeight / 2 + offY);
  }
}

window.NoteSplash = NoteSplash;
