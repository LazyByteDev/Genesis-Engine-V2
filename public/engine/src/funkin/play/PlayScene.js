// src/funkin/play/PlayScene.js

class PlayScene extends Phaser.Scene {
  constructor() {
    super({ key: "PlayScene" });
  }

  init() {
    this.playData = new window.PlayData(this);
  }

  preload() {
    window.PlayRefereePreload.execute(this);
  }

  create() {
    this.sound.stopAll();

    this.referee = new window.PlayReferee(this);

    this.events.once("shutdown", () => {
      window.PlayRefereeShutdown.execute(this.referee);
    });
  }

  update(time, delta) {
    window.PlayRefereeUpdate.execute(this.referee, time, delta);
  }
}

window.PlayScene = PlayScene;
window.game.scene.add("PlayScene", window.PlayScene);
