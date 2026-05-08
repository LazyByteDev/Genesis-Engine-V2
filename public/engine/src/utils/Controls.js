// src/utils/Controls.js

class Controls {
    static init() {
        const defaultPC = {
            // UI navigation
            UI_UP: [38, 87],
            UI_DOWN: [40, 83],
            UI_LEFT: [37, 65],
            UI_RIGHT: [39, 68],
            // Player notes
            NOTE_UP: [38, 87],
            NOTE_DOWN: [40, 83],
            NOTE_LEFT: [37, 65],
            NOTE_RIGHT: [39, 68],
            // Player 2 notes
            P2_NOTE_UP: [87, 38],
            P2_NOTE_DOWN: [83, 40],
            P2_NOTE_LEFT: [65, 37],
            P2_NOTE_RIGHT: [68, 39],
            // General actions
            ACCEPT: [13, 32, 90], // ENTER, SPACE, Z
            BACK: [27, 8, 88],
            PAUSE: [13, 27, 80],
            DEBUGG: [55, 103],
            // Global volume
            VOL_UP: [187, 107],
            VOL_DOWN: [189, 109],
            VOL_MUTE: [48, 96],
            DEV_TOOLS: [114]
        };

        const defaultGamepad = {
            UI_UP: [12],
            UI_DOWN: [13],
            UI_LEFT: [14],
            UI_RIGHT: [15],
            NOTE_UP: [12, 3],     // D-PAD UP, Y/Triangle
            NOTE_DOWN: [13, 0],   // D-PAD DOWN, A/Cross
            NOTE_LEFT: [14, 2],   // D-PAD LEFT, X/Square
            NOTE_RIGHT: [15, 1],  // D-PAD RIGHT, B/Circle
            P2_NOTE_UP: [12, 3],
            P2_NOTE_DOWN: [13, 0],
            P2_NOTE_LEFT: [14, 2],
            P2_NOTE_RIGHT: [15, 1],
            ACCEPT: [0, 9],       // A/Cross, Start
            BACK: [1],            // B/Circle
            PAUSE: [9],           // Start
            DEBUGG: [],
            VOL_UP: [],
            VOL_DOWN: [],
            VOL_MUTE: [],
            DEV_TOOLS: []
        };

        const savedPC = JSON.parse(localStorage.getItem('genesis_controls_pc'));
        const savedGP = JSON.parse(localStorage.getItem('genesis_controls_gp'));

        this.PCKeyBinds = savedPC || defaultPC;
        this.GamepadBinds = savedGP || defaultGamepad;

        // Construcción de la API limpia: Controls.ACCEPT(e), Controls.BACK(e), etc.
        Object.keys(this.PCKeyBinds).forEach(action => {
            Controls[action] = (e) => {
                if (!e) return false;

                // Si es un evento de teclado
                if (e.keyCode !== undefined) {
                    return this.PCKeyBinds[action].includes(e.keyCode);
                }

                // Si es un evento de Gamepad (Phaser o nativo suelen usar 'button' o 'index')
                let btnIndex = e.button !== undefined ? e.button : e.index;
                if (btnIndex !== undefined && this.GamepadBinds[action]) {
                    return this.GamepadBinds[action].includes(btnIndex);
                }

                return false;
            };
        });
    }
}

window.Controls = Controls;
Controls.init();