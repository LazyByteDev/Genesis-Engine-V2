function initWideScale() {
  if (!window.game || !window.game.scale) {
    requestAnimationFrame(initWideScale);
    return;
  }

  const scale = window.game.scale;

  // Automatic content scaling
  scale.scaleMode = Phaser.Scale.FIT;
  scale.autoCenter = Phaser.Scale.CENTER_BOTH;

  function resize() {
    const ratio = window.innerWidth / window.innerHeight;

    // 21:9 (approx 2.33) or 16:9 (approx 1.77)
    const isWide = ratio >= 2.33;
    const width = isWide ? 1680 : 1280;
    const height = 720;

    if (scale.gameSize.width !== width) {
      scale.resize(width, height);
    }

    scale.refresh();
  }

  window.addEventListener("resize", resize);
  resize();
}

initWideScale();
