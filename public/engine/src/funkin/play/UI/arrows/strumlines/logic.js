// src/funkin/play/UI/arrows/strumlines/logic.js

class StrumlineLogic {
  constructor(scene) {
    this.scene = scene;
    this.skins = scene.referee.skins;
    this.animations = this.skins.get("gameplay.strumline.animations");
    this.dirs = Object.keys(this.animations);

    this.opponentStrums = this.scene.add.group();
    this.playerStrums = this.scene.add.group();

    this.createStrumlines();

    this.onKeyDown = (e) => this.handleInput(e, true);
    this.onKeyUp = (e) => this.handleInput(e, false);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);

    this.scene.events.once("shutdown", this.shutdown, this);
  }

  createStrumlines() {
    const scale = this.skins.get("gameplay.strumline.scale") || 0.7;

    // NUEVO: Lee el espaciado desde el JSON, o usa el fallback matemático clásico
    const spacing = this.skins.get("gameplay.strumline.spacing") || (160 * scale);

    const totalWidth = spacing * this.dirs.length;

    const xOpp = this.scene.scale.width * 0.25 - totalWidth / 2 + spacing / 2;
    const xPlayer = this.scene.scale.width * 0.75 - totalWidth / 2 + spacing / 2;
    const yPos = 100;

    this.dirs.forEach((dir, i) => {
      const opp = new window.Strum(this.scene, xOpp + i * spacing, yPos, dir, i);
      const ply = new window.Strum(this.scene, xPlayer + i * spacing, yPos, dir, i);

      if (this.scene.referee.cameras) {
        this.scene.referee.cameras.add(opp, "ui");
        this.scene.referee.cameras.add(ply, "ui");
      }
      this.opponentStrums.add(opp);
      this.playerStrums.add(ply);
    });
  }

  handleInput(e, isDown) {
    if (e.repeat || !this.playerStrums || !this.playerStrums.scene) return;

    this.dirs.forEach((dir, i) => {
      const controlFunc = window.Controls[`NOTE_${dir.toUpperCase()}`];
      if (controlFunc && controlFunc(e)) {
        if (!this.playerStrums.getChildren) return;

        const strum = this.playerStrums.getChildren().find((s) => s.direction === dir);
        if (!strum) return;

        strum.isHeld = isDown;

        if (isDown) {
          const note = this.findHitNote(dir);

          if (note) {
            const diff = note.noteData.t - window.Conductor.songPosition;
            if (Math.abs(diff) <= window.Judgment.PBOT1_MISS_THRESHOLD) {
              this.processHit(note, diff, strum);
            } else {
              this.processMiss(strum);
            }
          } else {
            let holdingSustain = false;
            if (this.scene.referee.sustainLogic) {
                holdingSustain = this.scene.referee.sustainLogic.activeSustains.some(s =>
                    s.direction === dir && s.noteData.p === 'pl' && s.isBeingHeld && !s.missedNote
                );
            }

            if (!holdingSustain) {
                this.processMiss(strum);
            } else {
                strum.playAnim("confirm");
            }
          }
        } else {
          strum.playAnim("static");

          if (this.scene.referee.sustainLogic) {
              this.scene.referee.sustainLogic.onKeyRelease(dir);
          }
        }
      }
    });
  }

  findHitNote(direction) {
    if (!this.scene.referee.notesLogic || !this.scene.referee.notesLogic.activeNotes) return null;
    if (!this.scene.referee.notesLogic.activeNotes.getChildren) return null;

    const notes = this.scene.referee.notesLogic.activeNotes
      .getChildren()
      .filter((n) => n.noteData.p === "pl" && n.direction === direction);

    if (notes.length === 0) return null;

    return notes.sort(
      (a, b) =>
        Math.abs(a.noteData.t - window.Conductor.songPosition) -
        Math.abs(b.noteData.t - window.Conductor.songPosition),
    )[0];
  }

  processHit(note, diff, strum) {
    const rating = window.Judgment.getRating(diff);
    const score = window.Judgment.calculateScore(diff);

    this.scene.events.emit("noteHit", { note, rating, score });
    strum.playAnim("confirm");

    if (this.scene.referee.sustainLogic) {
        this.scene.referee.sustainLogic.onNoteHit(note);
    }

    note.destroy();
  }

  processMiss(strum) {
    strum.playAnim("press");

    this.scene.events.emit("noteMiss", { direction: strum.direction });
  }

  update(time, delta) {
    if (!this.opponentStrums || !this.playerStrums || !this.opponentStrums.scene) return;
    this.opponentStrums.getChildren().forEach((s) => s.update(time, delta));
    this.playerStrums.getChildren().forEach((s) => s.update(time, delta));
  }

  shutdown() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);

    if (this.opponentStrums && this.opponentStrums.scene) this.opponentStrums.clear(true, true);
    if (this.playerStrums && this.playerStrums.scene) this.playerStrums.clear(true, true);

    this.opponentStrums = null;
    this.playerStrums = null;
  }
}

window.StrumlineLogic = StrumlineLogic;
