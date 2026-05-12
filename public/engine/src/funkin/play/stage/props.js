// src/funkin/play/stage/props.js

class StageProps {
    static apply(obj, item) {
        if (!obj) return;

        // Coordenadas
        if (item.position) obj.setPosition(item.position[0], item.position[1]);

        // Si el JSON especifica origen, sobreescribe el 0,0 default
        if (item.origin) obj.setOrigin(item.origin[0], item.origin[1]);

        // Transformaciones visuales
        if (item.scale !== undefined) obj.setScale(item.scale);
        if (item.opacity !== undefined) obj.setAlpha(item.opacity);
        if (item.visible !== undefined) obj.setVisible(item.visible);
        if (item.flip_x !== undefined) obj.setFlipX(item.flip_x);
        if (item.flip_y !== undefined) obj.setFlipY(item.flip_y);

        // Efecto Parallax (Scroll Factor)
        if (item.scrollFactor !== undefined) {
            obj.setScrollFactor(item.scrollFactor, item.scrollFactor);
        }

        // Z-Index de capas
        if (item.layer !== undefined) {
            obj.setDepth(item.layer);
        }

        // Antialiasing (Pixel Art / Nearest Neighbor Filter)
        if (item.antialiasing !== undefined) {
            if (obj.texture) {
                if (item.antialiasing === false) {
                    // Aplica el filtro crudo (Pixel Art) sin difuminar
                    obj.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
                } else {
                    // Aplica el filtro suave tradicional (Antialiasing)
                    obj.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
                }
            }
        }
    }
}

window.StageProps = StageProps;
