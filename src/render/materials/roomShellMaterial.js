import * as THREE from 'three';
import { ditherChunk } from '../../shaders/dither.glsl.js';

// Plain dithered/pixelated BSOD-blue shell used for room walls/floor/ceiling.
// No decay/holes here — holes live on separate small quads (see decayMaterial.js).
export function createRoomShellMaterial({
  colorLow = new THREE.Color(0x040a2a),
  colorHigh = new THREE.Color(0x3a6bd6),
  cellSize = 90.0,
} = {}) {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      uColorLow: { value: colorLow },
      uColorHigh: { value: colorHigh },
      uCellSize: { value: cellSize },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColorLow;
      uniform vec3 uColorHigh;
      uniform float uCellSize;
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vWorldPos;

      ${ditherChunk}

      void main() {
        // mostly-solid field with slow, low-frequency mottling (not a
        // repeating UV ramp, which read as loud diagonal stripes) plus
        // Bayer-dithered quantization for a gritty, blocky texture.
        float mottle = sin(vWorldPos.x * 0.25 + uTime * 0.03) * cos(vWorldPos.z * 0.25) * 0.5 + 0.5;
        vec3 base = mix(uColorLow, uColorHigh, mottle * 0.25);
        vec3 dithered = ditherQuantize(base, gl_FragCoord.xy, 6.0);
        gl_FragColor = vec4(dithered, 1.0);
      }
    `,
  });
}
