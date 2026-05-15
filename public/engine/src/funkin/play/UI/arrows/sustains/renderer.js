// src/funkin/play/UI/arrows/sustains/renderer.js

class SustainTrail {
  constructor(scene, noteData, strumTarget) {
    this.scene = scene;
    this.noteData = noteData;
    this.strumTarget = strumTarget;
    this.direction = strumTarget.direction;

    const skins = scene.referee.skins;
    this.skinData = skins.get("gameplay.sustains");
    this.atlasKey = skins.getKey("gameplay.sustains.path") + "_XML";

    this.fullSustainLength = Number(noteData.l) || 0;
    this.sustainLength = this.fullSustainLength;

    this.isBeingHeld = false;
    this.wasGoodHit = false;
    this.missedNote = false;
    this.timeOfMiss = 0;
    this.isCompleted = false;
    this.isOut = false;

    const jsonScale = Number(this.skinData.scale !== undefined ? this.skinData.scale : 0.6);
    this.scaleVal = this.strumTarget.scaleX !== undefined ? this.strumTarget.scaleX : jsonScale;

    // Hereda su propio noteAlpha limpio de posiciones
    const jsonAlpha = Number(this.skinData.alpha !== undefined ? this.skinData.alpha : 1.0);
    this.alphaVal = this.strumTarget.noteAlpha !== undefined ? this.strumTarget.noteAlpha : jsonAlpha;

    const ratio = this.scaleVal / jsonScale;
    this.offsetX = this.skinData.Offset ? Number(this.skinData.Offset[0] || 0) * ratio : 0;
    this.offsetY = this.skinData.Offset ? Number(this.skinData.Offset[1] || 0) * ratio : 0;

    const strumSkinData = skins.get("gameplay.strumline");
    const strumScale = strumSkinData.scale !== undefined ? strumSkinData.scale : 0.7;
    const staticPrefix = strumSkinData.animations[this.direction].static;
    const strumAtlasKey = skins.getKey("gameplay.strumline.path") + "_XML";
    const strumTexture = scene.textures.get(strumAtlasKey);

    let staticWidth = 0;
    let staticHeight = 0;

    if (strumTexture && strumTexture.key !== "__MISSING") {
      const frames = strumTexture.getFrameNames();
      const staticFrameName = frames.find((f) => f.startsWith(staticPrefix));
      if (staticFrameName) {
        const frameData = strumTexture.get(staticFrameName);
        staticWidth = frameData.width * (this.strumTarget.scaleX || strumScale);
        staticHeight = frameData.height * (this.strumTarget.scaleY || strumScale);
      }
    }

    if (staticWidth === 0) {
      staticWidth = this.strumTarget.displayWidth;
      staticHeight = this.strumTarget.displayHeight;
    }

    const originX = this.strumTarget.originX !== undefined ? this.strumTarget.originX : 0.5;
    const originY = this.strumTarget.originY !== undefined ? this.strumTarget.originY : 0.5;

    const strumCenterX = this.strumTarget.baseX + (originX === 0 ? staticWidth / 2 : 0);
    const strumCenterY = this.strumTarget.baseY + (originY === 0 ? staticHeight / 2 : 0);

    this.fixedTargetX = strumCenterX + this.offsetX;
    this.fixedTargetY = strumCenterY + this.offsetY;

    this.bodyPieces = [];
    this.bodyFrameName = null;
    this.bodyFrameHeight = 0;

    this.endSprite = scene.add.sprite(0, 0, this.atlasKey).setDepth(20);

    if (scene.referee.cameras) {
      scene.referee.cameras.add(this.endSprite, "ui");
    }

    const anims = this.skinData.animations[this.direction];
    this.assignFrames(anims.body, anims.end);
  }

  assignFrames(bodyPrefix, endPrefix) {
    const texture = this.scene.textures.get(this.atlasKey);
    if (!texture) return;

    const frames = texture.getFrameNames();
    const bodyFrame = frames.find((f) => f.startsWith(bodyPrefix));
    const endFrame = frames.find((f) => f.startsWith(endPrefix));

    if (bodyFrame) {
      this.bodyFrameName = bodyFrame;
      const frameData = texture.get(bodyFrame);
      this.bodyFrameHeight = frameData.height;
    }

    if (endFrame) {
      this.endSprite.setFrame(endFrame);
      this.endSprite.setScale(this.scaleVal).setAlpha(this.alphaVal);
    }
  }

  updatePos(songTime, scrollSpeed, delta) {
    if (this.isCompleted || this.isOut) return;

    const strumDownscroll = this.strumTarget.downscroll;
    const dirMult = strumDownscroll ? -1 : 1;

    const targetX = this.fixedTargetX;
    const targetY = this.fixedTargetY;

    let currentLengthMs = this.fullSustainLength;
    if (this.wasGoodHit && !this.missedNote) {
      currentLengthMs = this.noteData.t + this.fullSustainLength - songTime;
    } else if (this.missedNote) {
      currentLengthMs = this.noteData.t + this.fullSustainLength - this.timeOfMiss;
    }

    this.sustainLength = currentLengthMs;

    if (this.sustainLength <= 10 && this.wasGoodHit) {
      this.isCompleted = true;
      this.setVisible(false);
      if (this.strumTarget.isHeld === false) this.strumTarget.playAnim("static");
      return;
    }

    const pixelsPerMs = 0.45 * scrollSpeed;
    let visualHeight = this.sustainLength * pixelsPerMs;

    let noteY = targetY + (this.noteData.t - songTime) * pixelsPerMs * dirMult;

    if (this.wasGoodHit && !this.missedNote) {
      noteY = targetY;
    }

    // Usamos puramente la opacidad calculada para optimizar visibilidad
    const isHidden = this.alphaVal <= 0;

    if (visualHeight <= 0 || isHidden) {
      this.bodyPieces.forEach((p) => p.setVisible(false));

      if (isHidden && this.endSprite) {
          this.endSprite.setVisible(false);
          let endPos = noteY + (visualHeight * dirMult);
          this.endSprite.setPosition(Math.round(targetX), Math.round(endPos));
          if (!strumDownscroll && this.endSprite.y < -300) this.isOut = true;
          else if (strumDownscroll && this.endSprite.y > this.scene.scale.height + 300) this.isOut = true;
      }
      return;
    }

    if (this.bodyFrameName && this.bodyFrameHeight > 0) {
      const basePieceH = this.bodyFrameHeight * this.scaleVal;
      const numPieces = Math.ceil(visualHeight / basePieceH);

      while (this.bodyPieces.length < numPieces) {
        const sp = this.scene.add.sprite(0, 0, this.atlasKey, this.bodyFrameName);
        sp.setDepth(20);
        if (this.scene.referee.cameras) this.scene.referee.cameras.add(sp, "ui");
        this.bodyPieces.push(sp);
      }

      const exactTargetX = Math.round(targetX);
      const exactPieceH = visualHeight / numPieces;
      let curY = noteY;

      for (let i = 0; i < this.bodyPieces.length; i++) {
        const sp = this.bodyPieces[i];

        if (i < numPieces) {
          sp.setVisible(true);
          sp.setAlpha(this.alphaVal);
          sp.setFlipY(strumDownscroll);

          let startY = Math.floor(curY);
          let nextY = Math.floor(curY + (exactPieceH * dirMult)) + (strumDownscroll ? -1 : 1);
          let endVisualY = noteY + (visualHeight * dirMult);

          if (!strumDownscroll) {
            if (nextY > Math.ceil(endVisualY)) nextY = Math.ceil(endVisualY);
            let integerHeight = nextY - startY;
            sp.setOrigin(0.5, 0);
            sp.setPosition(exactTargetX, startY);
            sp.setScale(this.scaleVal, Math.max(0, integerHeight) / this.bodyFrameHeight);
          } else {
            if (nextY < Math.floor(endVisualY)) nextY = Math.floor(endVisualY);
            let integerHeight = startY - nextY;
            sp.setOrigin(0.5, 1);
            sp.setPosition(exactTargetX, startY);
            sp.setScale(this.scaleVal, Math.max(0, integerHeight) / this.bodyFrameHeight);
          }

          curY += (exactPieceH * dirMult);
        } else {
          sp.setVisible(false);
        }
      }
    }

    if (this.endSprite) {
      this.endSprite.setVisible(true);
      this.endSprite.setFlipY(strumDownscroll);
      let endPos = noteY + (visualHeight * dirMult);
      this.endSprite.setPosition(Math.round(targetX), Math.round(endPos));

      if (!strumDownscroll) {
        this.endSprite.setOrigin(0.5, 0);
        if (this.endSprite.y < -300) this.isOut = true;
      } else {
        this.endSprite.setOrigin(0.5, 1);
        if (this.endSprite.y > this.scene.scale.height + 300) this.isOut = true;
      }
    }
  }

  setAlpha(val) {
    this.alphaVal = val;
    this.bodyPieces.forEach((p) => p.setAlpha(val));
    if (this.endSprite) this.endSprite.setAlpha(val);
  }

  setVisible(val) {
    this.bodyPieces.forEach((p) => p.setVisible(val));
    if (this.endSprite) this.endSprite.setVisible(val);
  }

  destroy() {
    this.bodyPieces.forEach((p) => p.destroy());
    this.bodyPieces = [];
    if (this.endSprite) this.endSprite.destroy();
  }
}

window.SustainTrail = SustainTrail;
