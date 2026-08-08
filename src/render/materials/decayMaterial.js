import * as THREE from 'three';
import { noiseChunk } from '../../shaders/noise.glsl.js';
import { ditherChunk } from '../../shaders/dither.glsl.js';

// Per-object torn-hole/tendril patch. Domain-warped noise drives an organic
// vein network; fragments past uThreshold are discarded (the actual cut),
// with a glowing rim blended from idle blue/white to hot red as uHoleFlush
// ramps (driven externally by portal-countdown state).
export function createDecayMaterial({
  seed = 0,
  threshold = 0.35,
  colorIdle = new THREE.Color(0x9fd3ff),
  colorHot = new THREE.Color(0xff2b2b),
} = {}) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uSeed: { value: seed },
      uThreshold: { value: threshold },
      uHoleFlush: { value: 0 },
      uColorIdle: { value: colorIdle },
      uColorHot: { value: colorHot },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uSeed;
      uniform float uThreshold;
      uniform float uHoleFlush;
      uniform vec3 uColorIdle;
      uniform vec3 uColorHot;
      uniform float uTime;
      varying vec2 vUv;

      ${noiseChunk}
      ${ditherChunk}

      void main() {
        vec2 uv = vUv * 3.0 - 1.5;
        float n = warpedTendrils(uv, uTime, uSeed);

        if (n > uThreshold) discard;

        float edgeDist = uThreshold - n;
        float rim = 1.0 - smoothstep(0.0, 0.18, edgeDist);

        vec3 veinColor = mix(uColorIdle, uColorHot, uHoleFlush);
        vec3 color = veinColor * rim;
        float alpha = rim;

        gl_FragColor = vec4(ditherQuantize(color, gl_FragCoord.xy, 4.0), alpha);
      }
    `,
  });
}
