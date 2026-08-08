import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const ScanlineShiftShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uIntensity: { value: 0.05 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uIntensity;
    varying vec2 vUv;
    void main() {
      float band = mod(gl_FragCoord.y, 6.0) < 3.0 ? 1.0 : -1.0;
      // Squared so idle intensity (~0.05) shifts by a fraction of a pixel
      // (was ~1-2.5px, enough to break thin/thick geometry like the room
      // wireframe into dashes) while high-intensity moments (transitions,
      // click-flash) keep their full dramatic tear.
      float shift = sin(vUv.y * 80.0 + uTime * 6.0) * uIntensity * uIntensity * 0.02 * band;
      vec2 uv = vec2(vUv.x + shift, vUv.y);
      gl_FragColor = texture2D(tDiffuse, uv);
    }
  `,
};

const ChromaticAberrationShader = {
  uniforms: {
    tDiffuse: { value: null },
    uIntensity: { value: 0.05 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uIntensity;
    varying vec2 vUv;
    void main() {
      vec2 offset = (vUv - 0.5) * uIntensity * 0.03;
      float r = texture2D(tDiffuse, vUv - offset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv + offset).b;
      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `,
};

const GlitchWipeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uWipeProgress: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uWipeProgress;
    varying vec2 vUv;

    float shardMask(vec2 uv, float angle, float offset, float t) {
      vec2 dir = vec2(cos(angle), sin(angle));
      float d = dot(uv - 0.5, dir) + offset;
      return step(t, d + 0.5);
    }

    void main() {
      if (uWipeProgress <= 0.001) {
        gl_FragColor = texture2D(tDiffuse, vUv);
        return;
      }
      vec2 uv = vUv;
      float m1 = shardMask(uv, 0.9, 0.15, 1.0 - uWipeProgress);
      float m2 = shardMask(uv, -1.3, -0.1, 1.0 - uWipeProgress * 0.8);
      float shard = clamp(m1 + m2, 0.0, 1.0);

      vec2 tearOffset = vec2(sin(uTime * 40.0) * 0.05, cos(uTime * 33.0) * 0.03) * shard * uWipeProgress;
      vec3 color = texture2D(tDiffuse, uv + tearOffset).rgb;

      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

// EffectComposer stack + a single 0-1 "glitch budget" driving scanline/CA
// intensity, plus a separate wipe-progress uniform for the hard transition
// shard-tear pass.
export class PostFX {
  constructor(renderer, scene, camera) {
    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(scene, camera));

    this.scanlinePass = new ShaderPass(ScanlineShiftShader);
    this.chromaticPass = new ShaderPass(ChromaticAberrationShader);
    this.glitchWipePass = new ShaderPass(GlitchWipeShader);

    this.composer.addPass(this.scanlinePass);
    this.composer.addPass(this.chromaticPass);
    this.composer.addPass(this.glitchWipePass);
    this.composer.addPass(new OutputPass());

    this.intensity = 0.05;
    this._time = 0;
  }

  setIntensity(level) {
    this.intensity = THREE.MathUtils.clamp(level, 0, 1);
  }

  setWipeProgress(p) {
    this.glitchWipePass.uniforms.uWipeProgress.value = THREE.MathUtils.clamp(p, 0, 1);
  }

  setSize(width, height) {
    this.composer.setSize(width, height);
  }

  update(delta) {
    this._time += delta;
    this.scanlinePass.uniforms.uTime.value = this._time;
    this.scanlinePass.uniforms.uIntensity.value = this.intensity;
    this.chromaticPass.uniforms.uIntensity.value = this.intensity;
    this.glitchWipePass.uniforms.uTime.value = this._time;
  }

  render() {
    this.composer.render();
  }
}
