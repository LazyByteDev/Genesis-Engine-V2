// src/funkin/play/UI/arrows/strumlines/positions.js

class ClassicalPosition {
    constructor(scene) {
        this.scene = scene;

        this.STRUMLINE_X_OFFSET = 100;
        this.STRUMLINE_Y_OFFSET = 100;
        this.DOWNSCROLL_MARGIN = this.STRUMLINE_Y_OFFSET + 30;

        const logicalSize = { x: 1280, y: 720 };
        this.cutoutSize = {
            x: Math.max(0, Math.ceil(this.scene.scale.width - logicalSize.x)),
            y: Math.max(0, Math.ceil(this.scene.scale.height - logicalSize.y))
        };
    }

    getPos(index, isPlayer, baseSpacing, baseScale, globalDownscroll, offsets = [0, 0], middleScroll = 'none', isMobile = false, hideOpStrums = false, hideOpNotes = false) {
        const width = this.scene.scale.width;
        const height = this.scene.scale.height;

        const logicalRatio = 1280 / 720;
        const currentRatio = width / height;
        const amplification = currentRatio / logicalRatio;

        let mode = middleScroll;
        if (isMobile) mode = 'mobile';

        let scale = baseScale;
        let strumAlpha = 1.0;
        let noteAlpha = 1.0;
        let actualDownscroll = globalDownscroll;

        // 1. Escalas Dinámicas, Scroll y Opacidad Base
        if (mode === 'mobile') {
            if (isPlayer) {
                scale = ((height / width) * 1.95) * amplification;
                actualDownscroll = true;
            } else {
                scale = baseScale * 0.4 * amplification;
                strumAlpha = 0.3;
                noteAlpha = 0.3;
                actualDownscroll = false;
            }
        } else if (mode === 'mini') {
            if (!isPlayer) {
                scale = baseScale * 0.4;
                strumAlpha = 0.5;
                noteAlpha = 0.5;
            }
        } else if (mode === 'split') {
            if (!isPlayer) {
                strumAlpha = 0.5;
                noteAlpha = 0.5;
            }
        }

        // --- LÓGICA JERÁRQUICA DE OCULTAMIENTO ---
        if (!isPlayer) {
            if (hideOpStrums) {
                strumAlpha = 0;
                noteAlpha = 0;
            } else if (hideOpNotes) {
                noteAlpha = 0; // Se ocultan notas, pero strums mantienen su alpha según el modo
            }
        }

        const spacing = 160 * scale;
        const strumHeight = 160 * scale;

        // 2. Cálculo en el Eje X
        let x = 0;
        if (isPlayer) {
            if (mode === 'mobile' || mode === 'split' || mode === 'mini') {
                let startX = (width / 2) - (spacing * 1.5);
                x = startX + (index * spacing);

                if (mode === 'mobile') {
                    const pos = 35 * amplification;
                    if (index === 0 || index === 1) x -= (pos * 2);
                    if (index === 2 || index === 3) x += pos;
                }
            } else {
                let startX = (width / 2) + this.STRUMLINE_X_OFFSET + (this.cutoutSize.x / 2.5);
                x = startX + (index * spacing);
            }
        } else {
            if (mode === 'split') {
                if (index === 0 || index === 1) {
                    x = this.STRUMLINE_X_OFFSET + (this.cutoutSize.x / 2.5) + (index * spacing);
                } else {
                    let rightStartX = width - this.STRUMLINE_X_OFFSET - (this.cutoutSize.x / 2.5) - (spacing * 2);
                    x = rightStartX + ((index - 2) * spacing);
                }
            } else if (mode === 'mini' || mode === 'mobile') {
                let startX = this.STRUMLINE_X_OFFSET - 30;
                x = startX + (index * spacing);
            } else {
                let startX = this.STRUMLINE_X_OFFSET + (this.cutoutSize.x / 2.5);
                x = startX + (index * spacing);
            }
        }

        // 3. Cálculo en el Eje Y
        let y = 0;
        let playerYBase = actualDownscroll
            ? (height - this.DOWNSCROLL_MARGIN - offsets[1] - (this.cutoutSize.y / 2))
            : (this.STRUMLINE_Y_OFFSET + offsets[1] + (this.cutoutSize.y / 2));

        if (isPlayer && mode === 'mobile') {
            y = (height - strumHeight) * 0.95;
        } else if (!isPlayer && mode === 'mini' && !isMobile) {
            const miniOffset = actualDownscroll ? -30 : 30;
            y = playerYBase + miniOffset;
        } else if (!isPlayer && (mode === 'mini' || mode === 'mobile')) {
            const safeTopMargin = (this.STRUMLINE_Y_OFFSET * 0.8) + (this.cutoutSize.y / 2);
            y = safeTopMargin;
            if (actualDownscroll) y = height - safeTopMargin - strumHeight;
        } else {
            y = playerYBase;
        }

        return { x, y, scale, strumAlpha, noteAlpha, downscroll: actualDownscroll };
    }
}

window.ClassicalPosition = ClassicalPosition;
