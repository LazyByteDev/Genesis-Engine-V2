class PlayScene extends Phaser.Scene {
  constructor() {
    super({ key: "PlayScene" });
  }

  create() {
    this.sound.stopAll();

    this.playload = new window.PlayLoad(this);

    const song = this.playload.get("CurrentSong") || "tutorial";
    const diff = this.playload.get("Difficulty") || "normal";
    const origin = this.playload.get("SceneOrigin") || "unknown";
    const playlist = this.playload.get("Playlist") || [song];
    const bpm = this.playload.meta("bpm") || 100;

    const w = this.scale.width;
    const h = this.scale.height;

    this.add
      .text(w / 2, h / 2 - 80, `CANCION: ${song.toUpperCase()}`, {
        fontFamily: "vcr",
        fontSize: "40px",
        fill: "#ffffff",
      })
      .setOrigin(0.5);

    this.add
      .text(
        w / 2,
        h / 2 - 20,
        `DIFICULTAD: ${diff.toUpperCase()} | BPM: ${bpm}`,
        {
          fontFamily: "vcr",
          fontSize: "30px",
          fill: "#ffffff",
        },
      )
      .setOrigin(0.5);

    this.add
      .text(w / 2, h / 2 + 40, `ORIGEN: ${origin.toUpperCase()}`, {
        fontFamily: "vcr",
        fontSize: "30px",
        fill: "#ffff00",
      })
      .setOrigin(0.5);

    this.add
      .text(
        w / 2,
        h / 2 + 100,
        `PLAYLIST: ${playlist.join(", ").toUpperCase()}`,
        {
          fontFamily: "vcr",
          fontSize: "20px",
          fill: "#00ff00",
        },
      )
      .setOrigin(0.5);

    this.input.keyboard.on("keydown", (e) => {
      if (Controls.BACK(e)) {
        let prevScene =
          origin === "freeplay" ? "FreeplayScene" : "MainMenuScene";
        if (window.transitionTo) window.transitionTo(this, prevScene);
        else this.scene.start(prevScene);
      }
    });
  }
}

window.PlayScene = PlayScene;
window.game.scene.add("PlayScene", window.PlayScene);
