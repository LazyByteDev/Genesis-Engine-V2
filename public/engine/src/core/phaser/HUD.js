class HUDScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HUDScene', active: true });
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
game.scene.add('HUDScene', HUDScene, true);