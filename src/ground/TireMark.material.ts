import {
  Color,
  ShaderMaterial,
  Vector3,
  type ShaderMaterialParameters,
} from 'three';

export interface TireMarkMaterialUniforms {
  uColor: { value: Color | null };
  [uniform: string]: { value: any };
}

export class TireMarkShaderMaterial extends ShaderMaterial {
  public uniforms: TireMarkMaterialUniforms;

  constructor(
    parameters?: ShaderMaterialParameters & {
      uniforms?: TireMarkMaterialUniforms;
    }
  ) {
    super(parameters);

    this.uniforms = parameters?.uniforms || {
      uColor: { value: null },
    };
  }
}

export const tireMarkMaterial = new TireMarkShaderMaterial({
  uniforms: {
    uColor: { value: null },
  },
  vertexShader: `
      attribute float instanceAlpha;
      varying float vAlpha;
      void main() {
        vAlpha = instanceAlpha;
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      }
    `,
  fragmentShader: `
      uniform vec3 uColor;
      varying float vAlpha;
      void main() {
        gl_FragColor = vec4(uColor.rgb, vAlpha * 1.0);
      }
    `,
  transparent: true,
});
