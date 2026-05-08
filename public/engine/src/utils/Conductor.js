/**
 * Constantes musicales base
 */
const ConductorConstants = {
    SECS_PER_MIN: 60,
    MS_PER_SEC: 1000,
    STEPS_PER_BEAT: 4,
    DEFAULT_BPM: 100,
    DEFAULT_TIME_SIGNATURE_NUM: 4,
    DEFAULT_TIME_SIGNATURE_DEN: 4
};

/**
 * Estructura para los cambios de tiempo de la canción
 */
class SongTimeChange {
    constructor(timeStamp = 0, bpm = 100, timeSignatureNum = 4, timeSignatureDen = 4) {
        this.timeStamp = timeStamp;
        this.bpm = bpm;
        this.beatTime = 0;
        this.timeSignatureNum = timeSignatureNum;
        this.timeSignatureDen = timeSignatureDen;
    }
}

/**
 * Clase principal que maneja los tiempos musicales del juego.
 * Adaptado de Flixel/Haxe a Phaser 3 / JS.
 */
class ConductorEngine {
    constructor() {
        // En Phaser, usamos EventEmitter en lugar de FlxSignal
        this.events = new Phaser.Events.EventEmitter();
        
        this.timeChanges = [];
        this.currentTimeChange = null;

        this.songPosition = 0;
        this.songPositionDelta = 0;
        
        this.prevTimestamp = 0;
        this.prevTime = 0;
        
        this.bpmOverride = null;

        this.currentMeasure = 0;
        this.currentBeat = 0;
        this.currentStep = 0;
        
        this.currentMeasureTime = 0;
        this.currentBeatTime = 0;
        this.currentStepTime = 0;

        this.instrumentalOffset = 0;
        this.formatOffset = 0;
    }

    // --- GETTERS ---

    get bpm() {
        if (this.bpmOverride !== null) return this.bpmOverride;
        if (!this.currentTimeChange) return ConductorConstants.DEFAULT_BPM;
        return this.currentTimeChange.bpm;
    }

    get startingBPM() {
        if (this.bpmOverride !== null) return this.bpmOverride;
        let timeChange = this.timeChanges[0];
        if (!timeChange) return ConductorConstants.DEFAULT_BPM;
        return timeChange.bpm;
    }

    get measureLengthMs() {
        return this.beatLengthMs * this.timeSignatureNumerator;
    }

    get beatLengthMs() {
        return ((ConductorConstants.SECS_PER_MIN / this.bpm) * ConductorConstants.MS_PER_SEC) * (4 / this.timeSignatureDenominator);
    }

    get stepLengthMs() {
        return this.beatLengthMs / ConductorConstants.STEPS_PER_BEAT;
    }

    get timeSignatureNumerator() {
        if (!this.currentTimeChange) return ConductorConstants.DEFAULT_TIME_SIGNATURE_NUM;
        return this.currentTimeChange.timeSignatureNum;
    }

    get timeSignatureDenominator() {
        if (!this.currentTimeChange) return ConductorConstants.DEFAULT_TIME_SIGNATURE_DEN;
        return this.currentTimeChange.timeSignatureDen;
    }

    get instrumentalOffsetSteps() {
        let startingStepLengthMs = (((ConductorConstants.SECS_PER_MIN / this.startingBPM) * ConductorConstants.MS_PER_SEC) * (4 / this.timeSignatureDenominator)) / ConductorConstants.STEPS_PER_BEAT;
        return this.instrumentalOffset / startingStepLengthMs;
    }

    get globalOffset() {
        // Obtiene el offset del localStorage (sincronizado con Neutralino)
        return parseInt(localStorage.getItem('genesis_global_offset')) || 0;
    }

    get audioVisualOffset() {
        return parseInt(localStorage.getItem('genesis_av_offset')) || 0;
    }

    get combinedOffset() {
        return this.instrumentalOffset + this.formatOffset + this.globalOffset;
    }

    get beatsPerMeasure() {
        return this.timeSignatureNumerator;
    }

    get stepsPerMeasure() {
        return Math.floor(this.timeSignatureNumerator * ConductorConstants.STEPS_PER_BEAT);
    }

    // --- MÉTODOS PÚBLICOS ---

    forceBPM(bpm = null) {
        if (bpm !== null) {
            console.log(`%c CONDUCTOR %c Forzando BPM a ${bpm}`, 'background: purple; color: white;', 'color: unset;');
        } else {
            console.log(`%c CONDUCTOR %c Reseteando BPM al default`, 'background: purple; color: white;', 'color: unset;');
        }
        this.bpmOverride = bpm;
    }

    /**
     * Mapea los eventos de cambio de tiempo de la canción (BPM changes)
     */
    mapTimeChanges(songTimeChanges) {
        this.timeChanges = [];
        
        // Ordenamos por tiempo por si vienen desordenados
        songTimeChanges.sort((a, b) => a.timeStamp - b.timeStamp);

        for (let songTimeChange of songTimeChanges) {
            if (songTimeChange.timeStamp < 0.0) songTimeChange.timeStamp = 0.0;

            if (songTimeChange.timeStamp <= 0.0) {
                songTimeChange.beatTime = 0.0;
            } else {
                songTimeChange.beatTime = 0.0;
                if (songTimeChange.timeStamp > 0.0 && this.timeChanges.length > 0) {
                    let prev = this.timeChanges[this.timeChanges.length - 1];
                    let newBeatTime = prev.beatTime + ((songTimeChange.timeStamp - prev.timeStamp) * prev.bpm / ConductorConstants.SECS_PER_MIN / ConductorConstants.MS_PER_SEC * (prev.timeSignatureDen / 4));
                    songTimeChange.beatTime = this.roundDecimal(newBeatTime, 4);
                }
            }
            this.timeChanges.push(songTimeChange);
        }

        if (this.timeChanges.length > 0) {
            console.log(`%c CONDUCTOR %c Mapeados ${this.timeChanges.length} cambios de tiempo. BPM inicial: ${this.timeChanges[0].bpm}`, 'background: purple; color: white;', 'color: unset;');
        }

        this.update(this.songPosition, false);
    }

    /**
     * Ciclo principal del conductor. Debe ser llamado en el `update()` de tu escena jugable.
     * @param {number} songPos - La posición actual de la música en ms (ej. music.seek * 1000)
     */
    update(songPos = 0, applyOffsets = true, forceDispatch = false) {
        // En Phaser, le pasamos la posición de la música directamente a la función,
        // esto evita acoplar el conductor a un objeto de audio específico globalmente.
        let currentTime = songPos; 

        if (applyOffsets) {
            currentTime += this.combinedOffset;
        }

        let oldMeasure = this.currentMeasure;
        let oldBeat = this.currentBeat;
        let oldStep = this.currentStep;

        this.songPosition = currentTime;

        // Buscar el cambio de tiempo actual
        this.currentTimeChange = this.timeChanges[0];
        if (this.songPosition > 0.0 && this.timeChanges.length > 0) {
            for (let i = 0; i < this.timeChanges.length; i++) {
                if (this.songPosition >= this.timeChanges[i].timeStamp) {
                    this.currentTimeChange = this.timeChanges[i];
                }
                if (this.songPosition < this.timeChanges[i].timeStamp) break;
            }
        }

        if (!this.currentTimeChange && this.bpmOverride === null) {
            console.warn("CONDUCTOR: El array timeChanges está vacío.");
        } else if (this.currentTimeChange && this.songPosition > 0.0) {
            
            let val = (this.currentTimeChange.beatTime * ConductorConstants.STEPS_PER_BEAT) + (this.songPosition - this.currentTimeChange.timeStamp) / this.stepLengthMs;
            this.currentStepTime = this.roundDecimal(val, 6);
            this.currentBeatTime = this.currentStepTime / ConductorConstants.STEPS_PER_BEAT;
            this.currentMeasureTime = this.getTimeInMeasures(this.songPosition);

            this.currentStep = Math.floor(this.currentStepTime);
            this.currentBeat = Math.floor(this.currentBeatTime);
            this.currentMeasure = Math.floor(this.currentMeasureTime);
        } else {
            // Asumir un BPM constante igual al forzado o inicial
            this.currentStepTime = this.roundDecimal((this.songPosition / this.stepLengthMs), 4);
            this.currentBeatTime = this.currentStepTime / ConductorConstants.STEPS_PER_BEAT;
            this.currentMeasureTime = this.currentStepTime / this.stepsPerMeasure;

            this.currentStep = Math.floor(this.currentStepTime);
            this.currentBeat = Math.floor(this.currentBeatTime);
            this.currentMeasure = Math.floor(this.currentMeasureTime);
        }

        // Emitir señales de Phaser si hubo un cambio
        if (this.currentStep !== oldStep || forceDispatch) {
            this.events.emit('stepHit', this.currentStep);
        }

        if (this.currentBeat !== oldBeat || forceDispatch) {
            this.events.emit('beatHit', this.currentBeat);
        }

        if (this.currentMeasure !== oldMeasure || forceDispatch) {
            this.events.emit('measureHit', this.currentMeasure);
        }

        if (this.prevTime !== this.songPosition) {
            this.songPositionDelta = 0;
            this.prevTime = this.songPosition;
            this.prevTimestamp = performance.now();
        }
    }

    // --- CONVERSIONES Y UTILIDADES MATEMÁTICAS ---

    getTimeInMeasures(ms) {
        if (this.timeChanges.length === 0) {
            return ms / this.stepLengthMs / this.stepsPerMeasure;
        }

        let resultMeasureTime = 0;
        ms = Math.max(0, ms);

        let lastTimeChange = this.timeChanges[0];
        let i = -1;

        for (let timeChange of this.timeChanges) {
            if (ms >= timeChange.timeStamp) {
                if (ms < timeChange.timeStamp || i === this.timeChanges.length - 1) {
                    lastTimeChange = timeChange;
                    break;
                }
                let currentStepLengthMs = (((ConductorConstants.SECS_PER_MIN / lastTimeChange.bpm) * ConductorConstants.MS_PER_SEC) * (4 / lastTimeChange.timeSignatureDen)) / ConductorConstants.STEPS_PER_BEAT;
                let currentStepsPerMeasure = lastTimeChange.timeSignatureNum * ConductorConstants.STEPS_PER_BEAT;
                resultMeasureTime += (timeChange.timeStamp - lastTimeChange.timeStamp) / currentStepLengthMs / currentStepsPerMeasure;
                lastTimeChange = timeChange;
            }
            i++;
        }

        let remainingStepLengthMs = (((ConductorConstants.SECS_PER_MIN / lastTimeChange.bpm) * ConductorConstants.MS_PER_SEC) * (4 / lastTimeChange.timeSignatureDen)) / ConductorConstants.STEPS_PER_BEAT;
        let remainingStepsPerMeasure = lastTimeChange.timeSignatureNum * ConductorConstants.STEPS_PER_BEAT;
        let remainingFractionalMeasure = (ms - lastTimeChange.timeStamp) / remainingStepLengthMs / remainingStepsPerMeasure;
        
        resultMeasureTime += remainingFractionalMeasure;
        return resultMeasureTime;
    }

    getTimeInSteps(ms) {
        if (this.timeChanges.length === 0) {
            return Math.floor(ms / this.stepLengthMs);
        }

        let resultStep = 0;
        ms = Math.max(0, ms);

        let lastTimeChange = this.timeChanges[0];
        let i = -1;

        for (let timeChange of this.timeChanges) {
            if (ms >= timeChange.timeStamp) {
                if (ms < timeChange.timeStamp || i === this.timeChanges.length - 1) {
                    lastTimeChange = timeChange;
                    break;
                }
                resultStep += (timeChange.beatTime - lastTimeChange.beatTime) * ConductorConstants.STEPS_PER_BEAT;
                lastTimeChange = timeChange;
            }
            i++;
        }

        let lastStepLengthMs = (((ConductorConstants.SECS_PER_MIN / lastTimeChange.bpm) * ConductorConstants.MS_PER_SEC) * (4 / lastTimeChange.timeSignatureDen)) / ConductorConstants.STEPS_PER_BEAT;
        let resultFractionalStep = (ms - lastTimeChange.timeStamp) / lastStepLengthMs;
        resultStep += resultFractionalStep;

        return resultStep;
    }

    getTypeLengthAtMs(ms, type = "beat") {
        if (this.timeChanges.length === 0) return 0;
        
        let wantedTimeChange = this.timeChanges[0];
        for (let timeChange of this.timeChanges) {
            if (ms >= timeChange.timeStamp) {
                wantedTimeChange = timeChange;
            } else {
                break;
            }
        }
        
        let wantedBeatLengthMs = ((ConductorConstants.SECS_PER_MIN / wantedTimeChange.bpm) * ConductorConstants.MS_PER_SEC) * (4 / wantedTimeChange.timeSignatureDen);
        
        switch (type.toLowerCase()) {
            case "measure":
            case "m":
                return wantedBeatLengthMs * wantedTimeChange.timeSignatureNum;
            case "beat":
            case "b":
                return wantedBeatLengthMs;
            case "step":
            case "s":
                return wantedBeatLengthMs / ConductorConstants.STEPS_PER_BEAT;
            default:
                return wantedBeatLengthMs;
        }
    }

    roundDecimal(value, precision) {
        let multiplier = Math.pow(10, precision || 0);
        return Math.round(value * multiplier) / multiplier;
    }
}

// Exportamos el Singleton de forma global
window.SongTimeChange = SongTimeChange;
window.Conductor = new ConductorEngine();