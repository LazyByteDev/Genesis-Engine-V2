// src/funkin/play/UI/arrows/strumlines/logic.js

class StrumlineLogic {
    constructor(scene) {
        this.scene = scene;
        this.skins = scene.referee.skins;
        this.animations = this.skins.get('gameplay.strumline.animations');
        this.dirMap = window.Directions.getMap(this.animations);

        this.opponentStrums = this.scene.add.group();
        this.playerStrums = this.scene.add.group();

        this.createStrumlines();

        this.onKeyDown = (e) => this.handleInput(e, true);
        this.onKeyUp = (e) => this.handleInput(e, false);
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
    }

    createStrumlines() {
        // Obtenemos la escala para calcular el espaciado correcto
        const scale = this.skins.get('gameplay.strumline.scale') !== undefined ? this.skins.get('gameplay.strumline.scale') : 0.7;

        // Base de tamaño de textura FNF estándar multiplicada por tu escala
        const spacing = 160 * scale;
        const dirs = Object.keys(this.animations);
        const totalWidth = spacing * dirs.length;

        // Calculamos el inicio en X considerando la separación (Centramos de acuerdo al tamaño total)
        const xOpp = (this.scene.scale.width * 0.25) - (totalWidth / 2) + (spacing / 2);
        const xPlayer = (this.scene.scale.width * 0.75) - (totalWidth / 2) + (spacing / 2);
        const yPos = 100;

        dirs.forEach((dir, i) => {
            const opp = new window.Strum(this.scene, xOpp + (i * spacing), yPos, dir, i);
            const ply = new window.Strum(this.scene, xPlayer + (i * spacing), yPos, dir, i);

            if (this.scene.referee.cameras) {
                this.scene.referee.cameras.add(opp, 'ui');
                this.scene.referee.cameras.add(ply, 'ui');
            }

            this.opponentStrums.add(opp);
            this.playerStrums.add(ply);
        });
    }

    handleInput(e, isDown) {
        if (e.repeat) return;

        Object.keys(this.animations).forEach(dir => {
            const controlFunc = window.Controls[`NOTE_${dir.toUpperCase()}`];
            if (controlFunc && controlFunc(e)) {
                const strum = this.playerStrums.getChildren().find(s => s.direction === dir);
                if (strum) {
                    if (isDown) {
                        strum.playAnim('press');
                    } else {
                        // Vuelve a static de inmediato sin animación reversa
                        strum.playAnim('static');
                    }
                }
            }
        });
    }

    update(time, delta) {
        if (this.opponentStrums) {
            this.opponentStrums.getChildren().forEach(s => s.update(time, delta));
        }
        if (this.playerStrums) {
            this.playerStrums.getChildren().forEach(s => s.update(time, delta));
        }
    }

    shutdown() {
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
    }
}

window.StrumlineLogic = StrumlineLogic;
