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
          obj.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
        } else {
          obj.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
        }
      }
    }

    // Efecto Chroma Key refactorizado para soportar objetos
    if (
      item.chromaKey !== undefined &&
      obj.scene.game.renderer.type === Phaser.WEBGL
    ) {
      let hexColor = "#000000";
      let tolerance = 0.1;
      let sensitivity = 0.1;

      // Soporte para el formato de Objeto
      if (typeof item.chromaKey === "object") {
        hexColor = item.chromaKey.color || "#000000";
        tolerance =
          item.chromaKey.tolerance !== undefined
            ? item.chromaKey.tolerance
            : 0.1;
        sensitivity =
          item.chromaKey.sensitivity !== undefined
            ? item.chromaKey.sensitivity
            : 0.1;
      }
      // Soporte antiguo (String plano)
      else {
        hexColor = item.chromaKey;
        tolerance =
          item.chromaTolerance !== undefined ? item.chromaTolerance : 0.1;
        sensitivity =
          item.chromaSensitivity !== undefined ? item.chromaSensitivity : 0.1;
      }

      this.applyChromaKey(obj, hexColor, tolerance, sensitivity);
    }
  }

  static applyChromaKey(obj, hexColor, tolerance = 0.1, sensitivity = 0.1) {
    const pipelineName = "ChromaKeyPipeline";

    // Registramos el pipeline dinámicamente en el motor si no existe aún
    if (!obj.scene.renderer.pipelines.has(pipelineName)) {
      class CustomChromaPipeline
        extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline
      {
        constructor(game) {
          super({
            game: game,
            renderTarget: true,
            fragShader: `
                        precision mediump float;
                        uniform sampler2D uMainSampler;
                        uniform vec3 uColor;
                        uniform float uTolerance;
                        uniform float uSensitivity;
                        varying vec2 outTexCoord;

                        void main() {
                            vec4 texColor = texture2D(uMainSampler, outTexCoord);

                            // Ignorar si ya es transparente
                            if (texColor.a < 0.0001) {
                                gl_FragColor = vec4(0.0);
                                return;
                            }

                            // Extraer RGB puro
                            vec3 rgb = texColor.rgb / texColor.a;
                            float distance = length(rgb - uColor);

                            // Blend para borrado de color
                            float alphaBlend = smoothstep(uTolerance, uTolerance + uSensitivity, distance);

                            // ALGORITMO ANTI-HALO (Spill Suppression)
                            // "Lava" la oscuridad residual para que los gradientes amarillos queden limpios
                            vec3 cleanColor = mix(rgb, rgb + (rgb - uColor) * 0.8, 1.0 - alphaBlend);
                            cleanColor = clamp(cleanColor, 0.0, 1.0);

                            float finalAlpha = texColor.a * alphaBlend;
                            gl_FragColor = vec4(cleanColor * finalAlpha, finalAlpha);
                        }
                        `,
          });

          // Inicializamos variables con valores por defecto
          this.uColor = [0.0, 0.0, 0.0];
          this.uTolerance = 0.1;
          this.uSensitivity = 0.1;
        }

        onPreRender() {
          if (this.uColor) {
            this.set3f(
              "uColor",
              this.uColor[0],
              this.uColor[1],
              this.uColor[2],
            );
          }
          this.set1f("uTolerance", this.uTolerance);
          this.set1f("uSensitivity", this.uSensitivity);
        }
      }
      obj.scene.renderer.pipelines.addPostPipeline(
        pipelineName,
        CustomChromaPipeline,
      );
    }

    let color = Phaser.Display.Color.HexStringToColor(hexColor);

    // 1. Aplicamos el pipeline al objeto (esto devuelve el SPRITE)
    obj.setPostPipeline(pipelineName);

    // 2. CORRECCIÓN: Usamos getPostPipeline para obtener la instancia real del SHADER
    let pipelineInstance = obj.getPostPipeline(pipelineName);

    if (Array.isArray(pipelineInstance)) {
      pipelineInstance = pipelineInstance[pipelineInstance.length - 1];
    }

    // 3. Inyectamos los valores del JSON directamente en el Shader
    if (pipelineInstance) {
      pipelineInstance.uColor = [color.r / 255, color.g / 255, color.b / 255];
      pipelineInstance.uTolerance = parseFloat(tolerance);
      pipelineInstance.uSensitivity = parseFloat(sensitivity);
    }
  }
}

window.StageProps = StageProps;
