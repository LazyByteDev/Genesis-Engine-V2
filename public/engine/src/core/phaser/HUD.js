class HUDScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HUDScene' });
    }

    create() {
        this.scene.bringToTop();
        window.HUD = this; 
    }

    injectElement(element) {
        if (!this.children.exists(element)) {
            this.add.existing(element);
        }
    }

    removeElement(element) {
        if (this.children.exists(element)) {
            this.children.remove(element);
        }
    }
}

window.HUDScene = HUDScene;

window.game.scene.add('HUDScene', window.HUDScene, true);