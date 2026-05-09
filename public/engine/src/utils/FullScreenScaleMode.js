// src/utils/FullScreenScaleMode.js

class FullScreenScaleMode {
  static cutoutSize = new Phaser.Math.Vector2(0, 0);
  static notchPosition = new Phaser.Math.Vector2(0, 0);
  static notchSize = new Phaser.Math.Vector2(0, 0);

  // El tamaño lógico en relación al tamaño inicial [cite: 7]
  static logicalSize = new Phaser.Math.Vector2(0, 0);

  // Relación de aspecto máxima (20:9 por defecto) [cite: 9]
  static maxAspectRatio = new Phaser.Math.Vector2(20, 9);
  static maxRatioAxis = "X";

  static gameRatio = -1;
  static gameCutoutSize = new Phaser.Math.Vector2(0, 0);
  static gameNotchPosition = new Phaser.Math.Vector2(0, 0);
  static gameNotchSize = new Phaser.Math.Vector2(0, 0);

  static screenRatio = -1;
  static wideScale = new Phaser.Math.Vector2(1, 1);
  static ratioAxis = "X";

  static instance = null;
  static _enabled = true;
  static hasFakeCutouts = false;

  // Variables internas que reemplazan BaseScaleMode
  static gameSize = new Phaser.Math.Vector2(0, 0);
  static deviceSize = new Phaser.Math.Vector2(0, 0);
  static offset = new Phaser.Math.Vector2(0, 0);
  static scale = new Phaser.Math.Vector2(1, 1);

  static horizontalAlign = "CENTER";
  static verticalAlign = "CENTER";

  static initialWidth = 1280;
  static initialHeight = 720;

  static cutoutRects = [null, null];
  static mustAwait = false;
  static awaitedSize = new Phaser.Math.Vector2(0, 0);
  static finishingAwait = false;

  static get enabled() {
    return this._enabled;
  }
  static set enabled(value) {
    // Validación adaptada de Haxe [cite: 111, 112]
    if (this.ratioAxis === "X" && (window.isAndroid || window.isMobile)) {
      this._enabled = value;
    } else {
      this._enabled = false;
    }

    if (this.instance != null) {
      this.mustAwait = false;
      this.horizontalAlign = this._enabled ? "LEFT" : "CENTER";
      this.verticalAlign = this._enabled ? "TOP" : "CENTER";
      this.instance.onMeasure(window.innerWidth, window.innerHeight);
    }
  }

  constructor(enable = true) {
    FullScreenScaleMode.instance = this;
    if (window.game && window.game.scale) {
      this.updateGameSize(window.innerWidth, window.innerHeight);
    }
    FullScreenScaleMode.enabled = enable;
  }

  onMeasure(width, height) {
    if (window.isDesktop) {
      if (FullScreenScaleMode.mustAwait && FullScreenScaleMode.enabled) {
        this.onMeasureAwait(width, height);
      } else {
        this.onMeasureInstant(width, height);
        FullScreenScaleMode.mustAwait = true;
      }
    } else {
      this.onMeasureInstant(width, height);
    }
  }

  onMeasureAwait(width, height) {
    FullScreenScaleMode.horizontalAlign = "CENTER";
    FullScreenScaleMode.verticalAlign = "CENTER";

    this.updateGameSize(
      FullScreenScaleMode.gameSize.x,
      FullScreenScaleMode.gameSize.y,
    );
    this.updateDeviceSize(width, height);

    this.updateScaleOffset();
    this.updateGamePosition();

    FullScreenScaleMode.awaitedSize.set(width, height);
  }

  onMeasurePostAwait() {
    if (window.isDesktop) {
      if (
        FullScreenScaleMode.awaitedSize.x === 0 &&
        FullScreenScaleMode.awaitedSize.y === 0
      )
        return;

      FullScreenScaleMode.horizontalAlign = FullScreenScaleMode.enabled
        ? "LEFT"
        : "CENTER";
      FullScreenScaleMode.verticalAlign = FullScreenScaleMode.enabled
        ? "TOP"
        : "CENTER";

      this.onMeasureInstant(
        Math.ceil(FullScreenScaleMode.awaitedSize.x),
        Math.ceil(FullScreenScaleMode.awaitedSize.y),
      );

      FullScreenScaleMode.awaitedSize.set(0, 0);
    }
  }

  onMeasureInstant(width, height) {
    FullScreenScaleMode.finishingAwait = true;

    this.updateGameSize(width, height);
    this.updateDeviceSize(width, height);
    this.updateDeviceCutout(width, height);

    this.updateScaleOffset();
    this.updateGamePosition();
    this.adjustGameSize();

    FullScreenScaleMode.finishingAwait = false;
  }

  static addCutouts(tweenDuration = 0.0, ease = "Linear") {
    if (
      (this.cutoutSize.x === 0 && this.ratioAxis === "X") ||
      (this.cutoutSize.y === 0 && this.ratioAxis === "Y")
    ) {
      return;
    }

    const scene = window.HUD || window.game.scene.scenes[0]; // Usamos HUDScene si existe
    if (!scene) return;

    for (let i = 0; i < this.cutoutRects.length; i++) {
      let rect = this.cutoutRects[i];

      if (!rect) {
        let rectW =
          (this.ratioAxis === "X"
            ? Math.ceil(this.cutoutSize.x / 2)
            : Math.ceil(this.gameSize.x)) + 1;
        let rectH =
          (this.ratioAxis === "Y"
            ? Math.ceil(this.cutoutSize.y / 2)
            : Math.ceil(this.gameSize.y)) + 1;

        rect = scene.add.rectangle(0, 0, rectW, rectH, 0x000000);
        rect.setOrigin(0, 0);
        rect.setDepth(9999);
        this.cutoutRects[i] = rect;
      }

      let targetX = 0;
      let targetY = 0;

      if (this.ratioAxis === "X") {
        rect.x =
          this.offset.x + (i === 0 ? -rect.width - 1 : this.gameSize.x + 1);
        targetX =
          this.offset.x + (i === 0 ? -1 : this.gameSize.x - rect.width + 1);
        rect.y = 0;
        targetY = 0;
      } else {
        rect.x = 0;
        targetX = 0;
        rect.y =
          this.offset.y + (i === 0 ? -rect.height - 1 : this.gameSize.y + 1);
        targetY =
          this.offset.y + (i === 0 ? -1 : this.gameSize.y - rect.height + 1);
      }

      rect.alpha = 0;

      if (tweenDuration > 0.0) {
        scene.tweens.add({
          targets: rect,
          x: targetX,
          y: targetY,
          alpha: 1,
          duration: tweenDuration * 1000,
          ease: ease,
        });
      } else {
        rect.x = targetX;
        rect.y = targetY;
        rect.alpha = 1;
      }
    }
    this.hasFakeCutouts = true;
  }

  static removeCutouts(tweenDuration = 0.0, ease = "Linear") {
    const scene = window.HUD || window.game.scene.scenes[0];

    for (let i = 0; i < this.cutoutRects.length; i++) {
      let rect = this.cutoutRects[i];
      if (!rect) continue;

      const targetX =
        this.ratioAxis === "Y"
          ? -1
          : this.offset.x + (i === 0 ? -rect.width - 1 : this.gameSize.x + 1);
      const targetY =
        this.ratioAxis === "X"
          ? -1
          : this.offset.y + (i === 0 ? -rect.height - 1 : this.gameSize.y + 1);

      if (tweenDuration > 0.0 && scene) {
        scene.tweens.add({
          targets: rect,
          x: targetX,
          y: targetY,
          alpha: 0,
          duration: tweenDuration * 1000,
          ease: ease,
        });
      } else {
        rect.x = targetX;
        rect.y = targetY;
        rect.alpha = 0;
      }
    }
    this.hasFakeCutouts = false;
  }

  updateDeviceSize(width, height) {
    FullScreenScaleMode.deviceSize.set(width, height);
  }

  updateDeviceCutout(width, height) {
    if (FullScreenScaleMode.enabled) {
      FullScreenScaleMode.cutoutSize.x =
        FullScreenScaleMode.ratioAxis === "X"
          ? Math.ceil(width - FullScreenScaleMode.logicalSize.x)
          : 0;
      FullScreenScaleMode.cutoutSize.y =
        FullScreenScaleMode.ratioAxis === "Y"
          ? Math.ceil(height - FullScreenScaleMode.logicalSize.y)
          : 0;

      FullScreenScaleMode.gameCutoutSize.copy(FullScreenScaleMode.cutoutSize);
      FullScreenScaleMode.gameCutoutSize.scale(
        FullScreenScaleMode.initialWidth / FullScreenScaleMode.logicalSize.x,
      );
    } else {
      FullScreenScaleMode.cutoutSize.set(0, 0);
      FullScreenScaleMode.gameCutoutSize.set(0, 0);
    }
  }

  updateGameSize(width, height) {
    FullScreenScaleMode.gameRatio =
      FullScreenScaleMode.initialWidth / FullScreenScaleMode.initialHeight;
    FullScreenScaleMode.screenRatio = width / height;
    FullScreenScaleMode.ratioAxis =
      FullScreenScaleMode.screenRatio < FullScreenScaleMode.gameRatio
        ? "Y"
        : "X";

    FullScreenScaleMode.logicalSize.set(width, height);

    if (FullScreenScaleMode.ratioAxis === "Y") {
      FullScreenScaleMode.gameSize.x = width;
      FullScreenScaleMode.logicalSize.y = Math.ceil(
        FullScreenScaleMode.gameSize.x / FullScreenScaleMode.gameRatio,
      );
      FullScreenScaleMode.gameSize.y = FullScreenScaleMode.enabled
        ? height
        : FullScreenScaleMode.logicalSize.y;
    } else {
      FullScreenScaleMode.gameSize.y = height;
      FullScreenScaleMode.logicalSize.x = Math.ceil(
        FullScreenScaleMode.gameSize.y * FullScreenScaleMode.gameRatio,
      );
      FullScreenScaleMode.gameSize.x = FullScreenScaleMode.enabled
        ? width
        : FullScreenScaleMode.logicalSize.x;
    }
  }

  updateScaleOffset() {
    if (FullScreenScaleMode.finishingAwait) {
      FullScreenScaleMode.scale.x =
        FullScreenScaleMode.ratioAxis === "X"
          ? FullScreenScaleMode.logicalSize.x / FullScreenScaleMode.initialWidth
          : FullScreenScaleMode.deviceSize.x / FullScreenScaleMode.initialWidth;
      FullScreenScaleMode.scale.y =
        FullScreenScaleMode.ratioAxis === "Y"
          ? FullScreenScaleMode.logicalSize.y /
            FullScreenScaleMode.initialHeight
          : FullScreenScaleMode.deviceSize.y /
            FullScreenScaleMode.initialHeight;
    } else {
      FullScreenScaleMode.scale.x =
        FullScreenScaleMode.deviceSize.x / FullScreenScaleMode.initialWidth;
      FullScreenScaleMode.scale.y =
        FullScreenScaleMode.deviceSize.y / FullScreenScaleMode.initialHeight;

      if (FullScreenScaleMode.scale.x > FullScreenScaleMode.scale.y)
        FullScreenScaleMode.scale.x = FullScreenScaleMode.scale.y;
      else FullScreenScaleMode.scale.y = FullScreenScaleMode.scale.x;
    }

    this.updateOffsetX();
    this.updateOffsetY();
  }

  updateOffsetX() {
    switch (FullScreenScaleMode.horizontalAlign) {
      case "LEFT":
        FullScreenScaleMode.offset.x = 0;
        break;
      case "CENTER":
        let gwX =
          FullScreenScaleMode.gameSize.x *
          (window.isDesktop && FullScreenScaleMode.enabled
            ? FullScreenScaleMode.scale.x
            : 1);
        FullScreenScaleMode.offset.x = Math.ceil(
          FullScreenScaleMode.finishingAwait && FullScreenScaleMode.enabled
            ? (FullScreenScaleMode.deviceSize.x -
                FullScreenScaleMode.gameSize.x) *
                0.5
            : (FullScreenScaleMode.deviceSize.x - gwX) * 0.5,
        );
        break;
      case "RIGHT":
        FullScreenScaleMode.offset.x =
          FullScreenScaleMode.deviceSize.x - FullScreenScaleMode.gameSize.x;
        break;
    }
  }

  updateOffsetY() {
    switch (FullScreenScaleMode.verticalAlign) {
      case "TOP":
        FullScreenScaleMode.offset.y = 0;
        break;
      case "CENTER":
        let gwY =
          FullScreenScaleMode.gameSize.y *
          (window.isDesktop && FullScreenScaleMode.enabled
            ? FullScreenScaleMode.scale.y
            : 1);
        FullScreenScaleMode.offset.y = Math.ceil(
          FullScreenScaleMode.finishingAwait && FullScreenScaleMode.enabled
            ? (FullScreenScaleMode.deviceSize.y -
                FullScreenScaleMode.gameSize.y) *
                0.5
            : (FullScreenScaleMode.deviceSize.y - gwY) * 0.5,
        );
        break;
      case "BOTTOM":
        FullScreenScaleMode.offset.y =
          FullScreenScaleMode.deviceSize.y - FullScreenScaleMode.gameSize.y;
        break;
    }
  }

  updateGamePosition() {
    // En Phaser, esto se gestionaría moviendo la cámara principal o ajustando el ScaleManager.
    if (window.game && window.game.canvas) {
      window.game.canvas.style.marginLeft = `${FullScreenScaleMode.offset.x}px`;
      window.game.canvas.style.marginTop = `${FullScreenScaleMode.offset.y}px`;
    }
  }

  reset() {
    FullScreenScaleMode.cutoutSize.set(0, 0);
    FullScreenScaleMode.gameCutoutSize.set(0, 0);
    FullScreenScaleMode.notchSize.set(0, 0);
    FullScreenScaleMode.gameNotchSize.set(0, 0);
    FullScreenScaleMode.notchPosition.set(0, 0);
    FullScreenScaleMode.gameNotchPosition.set(0, 0);
  }

  adjustGameSize() {
    if (
      (FullScreenScaleMode.cutoutSize.x > 0 ||
        FullScreenScaleMode.cutoutSize.y > 0) &&
      FullScreenScaleMode.enabled
    ) {
      FullScreenScaleMode.wideScale.set(1, 1);

      if (FullScreenScaleMode.ratioAxis === "Y") {
        let gameHeight =
          FullScreenScaleMode.gameSize.y / FullScreenScaleMode.scale.y;

        if (
          window.isDesktop &&
          FullScreenScaleMode.maxRatioAxis !== FullScreenScaleMode.ratioAxis
        ) {
          FullScreenScaleMode.gameSize.y -= FullScreenScaleMode.cutoutSize.y;
          FullScreenScaleMode.offset.y = Math.ceil(
            (FullScreenScaleMode.deviceSize.y -
              FullScreenScaleMode.gameSize.y) *
              0.5,
          );
          this.updateGamePosition();
          this.reset();
          return;
        }

        if (
          gameHeight / FullScreenScaleMode.initialWidth >
            FullScreenScaleMode.maxAspectRatio.y /
              FullScreenScaleMode.maxAspectRatio.x &&
          FullScreenScaleMode.maxRatioAxis === "Y"
        ) {
          const oldGameHeight = FullScreenScaleMode.gameSize.y;
          gameHeight =
            (FullScreenScaleMode.gameSize.x /
              FullScreenScaleMode.scale.x /
              FullScreenScaleMode.maxAspectRatio.x) *
            FullScreenScaleMode.maxAspectRatio.y;
          FullScreenScaleMode.gameSize.y =
            gameHeight * FullScreenScaleMode.scale.y;

          const sizeDifference = oldGameHeight - FullScreenScaleMode.gameSize.y;
          const scaleFactor =
            FullScreenScaleMode.logicalSize.y /
            FullScreenScaleMode.initialHeight;

          FullScreenScaleMode.cutoutSize.set(
            0,
            FullScreenScaleMode.cutoutSize.y - sizeDifference,
          );
          FullScreenScaleMode.gameCutoutSize.copy(
            FullScreenScaleMode.cutoutSize,
          );
          FullScreenScaleMode.gameCutoutSize.scale(1 / scaleFactor);

          FullScreenScaleMode.notchSize.y = Math.max(
            0,
            FullScreenScaleMode.notchSize.y - sizeDifference,
          );
          FullScreenScaleMode.gameNotchSize.y =
            FullScreenScaleMode.notchSize.y / scaleFactor;

          FullScreenScaleMode.offset.y = Math.ceil(
            (FullScreenScaleMode.deviceSize.y -
              FullScreenScaleMode.gameSize.y) *
              0.5,
          );
          this.updateGamePosition();
        }

        FullScreenScaleMode.wideScale.y =
          Math.ceil(gameHeight) / FullScreenScaleMode.initialHeight;
      } else {
        let gameWidth =
          FullScreenScaleMode.gameSize.x / FullScreenScaleMode.scale.x;

        if (
          window.isDesktop &&
          FullScreenScaleMode.maxRatioAxis !== FullScreenScaleMode.ratioAxis
        ) {
          FullScreenScaleMode.gameSize.x -= FullScreenScaleMode.cutoutSize.x;
          FullScreenScaleMode.offset.x = Math.ceil(
            (FullScreenScaleMode.deviceSize.x -
              FullScreenScaleMode.gameSize.x) *
              0.5,
          );
          this.updateGamePosition();
          this.reset();
          return;
        }

        if (
          gameWidth / FullScreenScaleMode.initialHeight >
            FullScreenScaleMode.maxAspectRatio.x /
              FullScreenScaleMode.maxAspectRatio.y &&
          FullScreenScaleMode.maxRatioAxis === "X"
        ) {
          const oldGameWidth = FullScreenScaleMode.gameSize.x;
          gameWidth =
            (FullScreenScaleMode.gameSize.y /
              FullScreenScaleMode.scale.y /
              FullScreenScaleMode.maxAspectRatio.y) *
            FullScreenScaleMode.maxAspectRatio.x;
          FullScreenScaleMode.gameSize.x =
            gameWidth * FullScreenScaleMode.scale.x;

          const sizeDifference = oldGameWidth - FullScreenScaleMode.gameSize.x;
          const scaleFactor =
            FullScreenScaleMode.logicalSize.x /
            FullScreenScaleMode.initialWidth;

          FullScreenScaleMode.cutoutSize.set(
            FullScreenScaleMode.cutoutSize.x - sizeDifference,
            0,
          );
          FullScreenScaleMode.gameCutoutSize.copy(
            FullScreenScaleMode.cutoutSize,
          );
          FullScreenScaleMode.gameCutoutSize.scale(1 / scaleFactor);

          FullScreenScaleMode.notchSize.x = Math.max(
            0,
            FullScreenScaleMode.notchSize.x - sizeDifference,
          );
          FullScreenScaleMode.gameNotchSize.x =
            FullScreenScaleMode.notchSize.x / scaleFactor;

          FullScreenScaleMode.offset.x = Math.ceil(
            (FullScreenScaleMode.deviceSize.x -
              FullScreenScaleMode.gameSize.x) *
              0.5,
          );
          this.updateGamePosition();
        }

        FullScreenScaleMode.wideScale.x =
          Math.ceil(gameWidth) / FullScreenScaleMode.initialWidth;
      }
    }
  }
}

window.FullScreenScaleMode = FullScreenScaleMode;

// Se inicializa automáticamente para interceptar tamaños
new FullScreenScaleMode();
