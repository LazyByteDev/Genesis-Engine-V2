// src/core/phaser/wide.js

function initWideScale() {
  if (!window.game || !window.game.scale) {
    requestAnimationFrame(initWideScale);
    return;
  }

  const scale = window.game.scale;

  // Cambiamos el modo de FIT a NONE. 
  // El modo FIT es el que causa la deformación al estirar la imagen.
  // Con NONE, el canvas mantiene una relación 1:1 entre píxeles lógicos y visuales.
  scale.scaleMode = Phaser.Scale.NONE;
  scale.autoCenter = Phaser.Scale.CENTER_BOTH;

  function resize() {
    // Obtenemos las dimensiones reales de la ventana del navegador.
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const ratio = windowWidth / windowHeight;

    // Mantenemos 720 como base de altura. 
    // Esto garantiza que tus sprites y posiciones Y no necesiten reescalarse manualmente.
    const baseHeight = 720;
    
    // Calculamos el ancho dinámico para que coincida exactamente con el formato del monitor.
    // - En 16:9 (Estándar): El ancho será 1280px.
    // - En 21:9 (Ultrawide): El ancho será ~1680px.
    // - En dispositivos móviles (Vertical): El ancho se reducirá proporcionalmente.
    const dynamicWidth = Math.ceil(baseHeight * ratio);

    // Redimensionamos la resolución interna del motor.
    // Al usar scale.resize(), Phaser actualiza el ancho de la escena (scene.scale.width),
    // permitiendo que elementos centrados o alineados a los bordes se ajusten solos.
    scale.resize(dynamicWidth, baseHeight);

    // Ajustamos el tamaño visual del canvas mediante CSS para que ocupe toda la pantalla.
    if (scale.canvas) {
      scale.canvas.style.width = windowWidth + 'px';
      scale.canvas.style.height = windowHeight + 'px';
    }

    scale.refresh();
  }

  // Escuchamos el evento de redimensión del navegador.
  window.addEventListener("resize", resize);
  
  // Ejecutamos la función una vez al inicio para establecer el tamaño inicial.
  resize();
}

initWideScale();