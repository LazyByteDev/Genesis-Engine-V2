window.GenesisConfig = {
    type: Phaser.AUTO,
    parent: 'gamecontainer',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1280,
        height: 720
    },
    backgroundColor: '#000000'
};

window.game = new Phaser.Game(window.GenesisConfig);