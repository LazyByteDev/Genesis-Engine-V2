// src/core/phaser/wide.js

function initWideScale() {
  // Limpiamos los márgenes por defecto del navegador para que el FIT calcule bien
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.overflow = 'hidden'; // Evita barras de scroll
  document.body.style.backgroundColor = '#000000';

  if (!window.game || !window.game.scale) {
    requestAnimationFrame(initWideScale);
    return;
  }

  const scale = window.game.scale;
  
  // Aseguramos que los modos nativos estén activos
  scale.scaleMode = Phaser.Scale.FIT;
  scale.autoCenter = Phaser.Scale.CENTER_BOTH;

  // En el modo FIT, solo necesitamos decirle a Phaser que vuelva a medir si la ventana cambia
  window.addEventListener("resize", () => {
    scale.refresh();
  });

  scale.refresh();
}

initWideScale();