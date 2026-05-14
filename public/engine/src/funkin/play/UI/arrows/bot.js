// src/funkin/play/UI/arrows/bot.js

class BotLogic {
  constructor(scene) {
    this.scene = scene;
    this.enemyBot = true; // Bot del oponente
    this.botPlay = false; // Bot del jugador
  }

  update(time, delta) {
    const notesLogic = this.scene.referee.notesLogic;
    const sustainLogic = this.scene.referee.sustainLogic;
    const strumlines = this.scene.referee.strumlines;

    if (!notesLogic || !strumlines) return;

    const songTime =
      window.Conductor && window.Conductor.songPosition !== undefined
        ? window.Conductor.songPosition
        : 0;

    // 1. Lógica para Notas Normales
    if (notesLogic.activeNotes) {
      notesLogic.activeNotes.getChildren().forEach((note) => {
        const diff = note.noteData.t - songTime;

        if (diff <= 0) {
          if (note.noteData.p === "op" && this.enemyBot) {
            this.hitOpponent(note, strumlines);
          } else if (note.noteData.p === "pl" && this.botPlay) {
            this.hitPlayer(note, strumlines);
          }
        }
      });
    }

    // 2. Lógica para Notas Largas (Sustains)
    if (sustainLogic && sustainLogic.activeSustains) {
      sustainLogic.activeSustains.forEach((sustain) => {
        const isBottingPlayer = sustain.noteData.p === "pl" && this.botPlay;
        const isBottingOpponent = sustain.noteData.p === "op" && this.enemyBot;

        if (isBottingPlayer || isBottingOpponent) {
          if (
            songTime >= sustain.noteData.t &&
            songTime <= sustain.noteData.t + sustain.fullSustainLength
          ) {
            sustain.wasGoodHit = true;
            sustain.isBeingHeld = true;

            if (
              !sustain.strumTarget.anims.currentAnim ||
              !sustain.strumTarget.anims.currentAnim.key.includes("confirm")
            ) {
              sustain.strumTarget.playAnim("confirm");
            }
          } else if (
            songTime >
            sustain.noteData.t + sustain.fullSustainLength
          ) {
            sustain.isBeingHeld = false;
            sustain.strumTarget.playAnim("static");
          }
        }
      });
    }
  }

  hitOpponent(note, strumlines) {
    const strum = strumlines.opponentStrums
      .getChildren()
      .find((s) => s.direction === note.direction);
    if (strum) {
      // INDICADOR CLAVE: Le decimos al motor que esta nota fue tocada por la IA rival
      note.isBotPlay = true;

      // Emitimos el evento de forma limpia por si lo requieres para otra cosa
      this.scene.events.emit("noteHit", { note: note });

      strum.playAnim("confirm");
    }
    note.destroy();
  }

  hitPlayer(note, strumlines) {
    const strum = strumlines.playerStrums
      .getChildren()
      .find((s) => s.direction === note.direction);
    if (strum) {
      note.isBotPlay = true;
      strumlines.processHit(note, 0, strum);
    } else {
      note.destroy();
    }
  }

  shutdown() {
    this.scene = null;
  }
}

window.BotLogic = BotLogic;
