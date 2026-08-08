import * as THREE from 'three';
import { ditherChunk } from '../../shaders/dither.glsl.js';

// Unlit object material with a fresnel/rim glow standing in for a hard
// outline — idle white, flips to red and stays red once clicked, with a
// subtle pulse. Cheap (no extra mesh/pass) and fits the BSOD-glitch look
// better than a hard silhouette line.
export function createObjectMaterial({
  baseColor = new THREE.Color(0x0d1a4a),
  outlineColor = new THREE.Color(0xffffff),
  fresnelPower = 2.2,
} = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uBaseColor: { value: baseColor },
      uOutlineColor: { value: outlineColor },
      uFresnelPower: { value: fresnelPower },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vNormal = normalize(mat3(modelMatrix) * normal);
        vViewDir = normalize(cameraPosition - worldPos.xyz);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uBaseColor;
      uniform vec3 uOutlineColor;
      uniform float uFresnelPower;
      uniform float uTime;
      varying vec3 vNormal;
      varying vec3 vViewDir;

      ${ditherChunk}

      void main() {
        float fresnel = pow(1.0 - clamp(dot(normalize(vViewDir), normalize(vNormal)), 0.0, 1.0), uFresnelPower);
        float pulse = 0.85 + 0.15 * sin(uTime * 3.0);
        float t = clamp(fresnel * pulse, 0.0, 1.0);
        // Dither the blend factor (not each RGB channel independently) so
        // the result always sits on the base->outline line instead of
        // drifting into stray hues as channels quantize at different rates.
        float ditheredT = ditherQuantize(vec3(t), gl_FragCoord.xy, 6.0).x;
        vec3 color = mix(uBaseColor, uOutlineColor, ditheredT);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
}
