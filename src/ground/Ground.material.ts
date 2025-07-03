import {
  ShaderMaterial,
  Texture,
  Vector3,
  type ColorRepresentation,
  type IUniform,
  type ShaderMaterialParameters,
} from 'three';

export interface GroundMaterialUniforms {
  uColor: { value: Vector3 | null };
  uTexture: { value: Texture | null };
  uTireMarksTexture: { value: Texture | null };
  [uniform: string]: IUniform<any>;
}

export class GroundShaderMaterial extends ShaderMaterial {
  public uniforms: GroundMaterialUniforms;

  constructor(
    parameters?: ShaderMaterialParameters & {
      uniforms?: GroundMaterialUniforms;
    }
  ) {
    super(parameters);

    console.log('GroundShaderMaterial', this);

    this.uniforms = parameters?.uniforms || {
      uColor: { value: null },
      uTexture: { value: null },
      uTireMarksTexture: { value: null },
    };
  }
}

export const groundMaterial = new GroundShaderMaterial({
  uniforms: {
    uColor: { value: null },
    uTexture: { value: null },
    uTireMarksTexture: { value: null },
  },
  vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
  fragmentShader: `
      uniform vec3 uColor;
      uniform sampler2D uTexture;
      uniform sampler2D uTireMarksTexture;

      varying vec2 vUv;

      void main() {
        vec4 textureFactor = texture2D(uTexture, vUv);

        vec4 tireMarksTextureFactor = texture2D(uTireMarksTexture, vUv);

        gl_FragColor = vec4(uColor, 1.0) + textureFactor + tireMarksTextureFactor;
      }
    `,
  transparent: true,
});
