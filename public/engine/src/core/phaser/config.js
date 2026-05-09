// src/core/phaser/config.js

window.GenesisConfig = {
    type: Phaser.AUTO,
    width: 1280, // Ancho inamovible
    height: 720, // Alto inamovible
    backgroundColor: '#000000',
    scale: {
        // La magia de Phaser: Escala para caber en pantalla manteniendo proporción 16:9
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
        pixelArt: false,
        antialias: true,
    }
};