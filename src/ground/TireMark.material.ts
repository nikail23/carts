import { Color, ShaderMaterial } from 'three';

export const tireMarkMaterial = new ShaderMaterial({
  uniforms: {
    color: { value: new Color(0x555555) },
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
      uniform vec3 color;
      varying float vAlpha;
      void main() {
        gl_FragColor = vec4(color, vAlpha * 0.5);
      }
    `,
  transparent: true,
});
