// src/funkin/play/UI/arrows/splash/renderer.js

class NoteSplash extends Phaser.GameObjects.Sprite {
  constructor(scene) {
    const skins = scene.referee.skins;
    const atlasKey = skins.getKey("gameplay.noteSplashes.path") + "_XML";
    super(scene, 0, 0, atlasKey);

    this.setOrigin(0, 0);
    this.setDepth(200);
    this.scene.add.existing(this);

    if (this.scene.referee.cameras) {
      this.scene.referee.cameras.add(this, "ui");
    }

    this.on("animationcomplete", () => {
      this.setVisible(false);
      this.setActive(false);
    });
  }

  spawn(strumTarget, skinData) {
    const direction = strumTarget.direction;
    const anims = skinData.animations[direction];
    if (!anims) return;

    const animToPlay = anims[Math.floor(Math.random() * anims.length)];
    if (!this.scene.anims.exists(animToPlay)) return;

    this.setActive(true);
    this.setVisible(true);

    // Heredar el noteAlpha para evitar splashes fantasma si las notas están ocultas
    const jsonAlpha = skinData.alpha !== undefined ? skinData.alpha : 1;
    const targetAlpha = strumTarget.noteAlpha !== undefined ? strumTarget.noteAlpha : jsonAlpha;
    this.setAlpha(targetAlpha);

    if (targetAlpha <= 0) {
        this.setVisible(false);
        this.setActive(false);
        return;
    }

    const jsonScale = skinData.scale !== undefined ? skinData.scale : 1;
    const strumScale = strumTarget.scaleX !== undefined ? strumTarget.scaleX : 0.7;
    const baseStrumScale = this.scene.referee.skins.get("gameplay.strumline.scale") || 0.7;

    const amplificationRatio = strumScale / baseStrumScale;
    const finalScale = jsonScale * amplificationRatio;
    this.setScale(finalScale);

    if (skinData.chromaKey && window.StageProps) {
      window.StageProps.applyChromaKey(
        this,
        skinData.chromaKey.color || skinData.chromaKey,
      );
    }

    this.play(animToPlay);

    const visualWidth = this.width * this.scaleX;
    const visualHeight = this.height * this.scaleY;

    const offX = (skinData.Offset ? skinData.Offset[0] : 0) * amplificationRatio;
    const offY = (skinData.Offset ? skinData.Offset[1] : 0) * amplificationRatio;

    this.setPosition(
        strumTarget.x - visualWidth / 2 + offX,
        strumTarget.y - visualHeight / 2 + offY
    );
  }
}

window.NoteSplash = NoteSplash;
