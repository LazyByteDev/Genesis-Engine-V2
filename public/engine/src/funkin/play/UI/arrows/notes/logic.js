// src/funkin/play/UI/arrows/notes/logic.js

class NoteLogic {
    constructor(scene) {
        this.scene = scene;
        this.strumlines = this.scene.referee.strumlines;

        this.chartNotes = this.scene.referee.chart.getNotes();
        this.dirs = Object.keys(this.strumlines.animations);

        this.activeNotes = this.scene.add.group();
        this.noteIndex = 0;

        this.scrollSpeed = this.scene.playData.get('scrollSpeed', 2.0);
    }

    update(time, delta) {
        const songTime = window.Conductor.songPosition;

        // Aumentamos el umbral a 3000ms (3 segundos visuales antes de que lleguen a la flecha).
        // Esto permite que las notas empiecen a dibujarse y subir mientras el Countdown está contando.
        const spawnThreshold = 3000 / this.scrollSpeed;

        // 1. LÓGICA DE SPAWN TARDÍO/TEMPRANO
        while (this.noteIndex < this.chartNotes.length) {
            const noteData = this.chartNotes[this.noteIndex];

            // Permite spawnear si la nota está dentro de los próximos 3 segundos
            if (noteData.t - songTime <= spawnThreshold) {
                this.spawnNote(noteData);
                this.noteIndex++;
            } else {
                break;
            }
        }

        // 2. ACTUALIZACIÓN VISUAL Y DESTRUCCIÓN
        this.activeNotes.getChildren().forEach(note => {
            note.updatePos(songTime, this.scrollSpeed);

            // Si la nota subió y sobrepasó por mucho la flecha, se destruye
            if (note.y < -150) {
                note.destroy();
            }
        });
    }

    spawnNote(noteData) {
        const isPlayer = noteData.p === 'pl';
        const strumsGroup = isPlayer ? this.strumlines.playerStrums : this.strumlines.opponentStrums;

        const directionName = this.dirs[noteData.d];
        const targetStrum = strumsGroup.getChildren().find(s => s.direction === directionName);

        if (targetStrum) {
            const note = new window.Note(this.scene, noteData, targetStrum);

            if (this.scene.referee.cameras) {
                this.scene.referee.cameras.add(note, 'ui');
            }

            this.activeNotes.add(note);
        }
    }

    shutdown() {
        this.activeNotes.clear(true, true);
    }
}

window.NoteLogic = NoteLogic;
