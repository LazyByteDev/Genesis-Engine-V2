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

    this.scaleVal = Number(this.skinData.scale !== undefined ? this.skinData.scale : 0.6);
    this.alphaVal = Number(this.skinData.alpha !== undefined ? this.skinData.alpha : 1.0);

    this.offsetX = this.skinData.Offset ? Number(this.skinData.Offset[0] || 0) : 0;
    this.offsetY = this.skinData.Offset ? Number(this.skinData.Offset[1] || 0) : 0;

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
        staticWidth = frameData.width * strumScale;
        staticHeight = frameData.height * strumScale;
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

    this.endSprite = scene.add.sprite(0, 0, this.atlasKey).setOrigin(0.5, 0).setDepth(20);

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
      if (this.strumTarget.isHeld === false)
        this.strumTarget.playAnim("static");
      return;
    }

    const pixelsPerMs = 0.45 * scrollSpeed;

    let physicalTopRaw = targetY + (this.noteData.t - songTime) * pixelsPerMs;
    let fullDisplayHeightRaw = this.fullSustainLength * pixelsPerMs;

    let physicalTop = Math.round(physicalTopRaw);
    let fullDisplayHeight = Math.round(fullDisplayHeightRaw);
    let physicalBottom = physicalTop + fullDisplayHeight;

    let visualTop = physicalTop;

    if (this.wasGoodHit && !this.missedNote) {
      if (visualTop < targetY) {
        visualTop = Math.round(targetY);
      }
    }

    let visualHeight = physicalBottom - visualTop;

    if (visualHeight <= 0) {
      visualHeight = 0;
      this.bodyPieces.forEach((p) => p.setVisible(false));
    } else {
      if (this.bodyFrameName && this.bodyFrameHeight > 0) {
        const basePieceH = this.bodyFrameHeight * this.scaleVal;

        // Calculamos cuántas piezas se necesitan.
        const numPieces = Math.ceil(visualHeight / basePieceH);

        while (this.bodyPieces.length < numPieces) {
          const sp = this.scene.add.sprite(0, 0, this.atlasKey, this.bodyFrameName);
          sp.setOrigin(0.5, 0).setDepth(20);
          if (this.scene.referee.cameras)
            this.scene.referee.cameras.add(sp, "ui");
          this.bodyPieces.push(sp);
        }

        const exactTargetX = Math.round(targetX);
        const endVisualY = visualTop + visualHeight;

        // Magia Anti-Gaps: Distribuimos las piezas matemáticamente y forzamos un solape de altura
        const exactPieceH = visualHeight / numPieces;
        let curY = visualTop;

        for (let i = 0; i < this.bodyPieces.length; i++) {
          const sp = this.bodyPieces[i];

          if (i < numPieces && curY < endVisualY) {
            sp.setVisible(true);
            sp.setAlpha(this.alphaVal);

            let startY = Math.floor(curY);
            // +1 píxel de superposición para tapar fracturas entre los límites
            let nextY = Math.ceil(curY + exactPieceH) + 1;

            if (nextY > Math.ceil(endVisualY)) {
              nextY = Math.ceil(endVisualY);
            }

            let integerHeight = nextY - startY;

            if (integerHeight > 0) {
              sp.setPosition(exactTargetX, startY);
              sp.setCrop();
              // Se expanden escalándose equitativamente
              sp.setScale(this.scaleVal, integerHeight / this.bodyFrameHeight);
            } else {
              sp.setVisible(false);
            }

            curY += exactPieceH;
          } else {
            sp.setVisible(false);
          }
        }
      }
    }

    if (this.endSprite) {
      this.endSprite.setPosition(Math.round(targetX), physicalBottom);
      if (this.endSprite.y < -300) {
        this.isOut = true;
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
