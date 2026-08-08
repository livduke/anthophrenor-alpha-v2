import * as THREE from 'three';
import { noiseChunk } from '../shaders/noise.glsl.js';

const FLY_DURATION = 1.2;
const VOID_DURATION = 0.6;
const IDLE_INTENSITY = 0.05;

function createVoidMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      varying vec2 vUv;
      ${noiseChunk}
      void main() {
        float n = fbm(vUv * 40.0 + uTime * 25.0);
        float band = step(0.98, fract(vUv.y * 200.0 + uTime * 4.0));
        vec3 color = vec3(0.05, 0.08, 0.18) + vec3(n * 0.6 + band * 0.4);
        gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
      }
    `,
  });
}

// Drives the portal flythrough (camera lerps toward the hole while PostFX
// spikes), then a held TV-static void, then hands off to onArrive (scene
// swap) before fading back to idle intensity.
export class TransitionController {
  constructor({ camera, renderer, postFX }) {
    this.camera = camera;
    this.renderer = renderer;
    this.postFX = postFX;

    this.state = 'idle';
    this._elapsed = 0;
    this._voidElapsed = 0;
    this._startPos = new THREE.Vector3();
    this._targetPos = new THREE.Vector3();
    this._skipHeldRef = null;
    this._onArrive = null;
    this._voidTime = 0;
    this._holdVoidFlag = false;

    this._voidScene = new THREE.Scene();
    this._voidCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this._voidMaterial = createVoidMaterial();
    this._voidScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this._voidMaterial));
  }

  get isActive() {
    return this.state !== 'idle';
  }

  get isVoid() {
    return this.state === 'void';
  }

  play(holeWorldPos, { skipHeld, onArrive }) {
    if (this.state !== 'idle') return;
    this.state = 'flythrough';
    this._elapsed = 0;
    this._holdVoidFlag = false;
    this._startPos.copy(this.camera.position);
    this._targetPos.copy(holeWorldPos);
    this._skipHeldRef = skipHeld;
    this._onArrive = onArrive;
  }

  holdVoid() {
    this._holdVoidFlag = true;
  }

  update(delta) {
    if (this.state === 'idle') return;

    if (this.state === 'flythrough') {
      const speedMul = this._skipHeldRef?.() ? 4 : 1;
      this._elapsed += delta * speedMul;
      const t = Math.min(this._elapsed / FLY_DURATION, 1);
      this.camera.position.lerpVectors(this._startPos, this._targetPos, t);
      this.postFX.setIntensity(1.0);
      this.postFX.setWipeProgress(t);

      if (t >= 1) {
        this.state = 'void';
        this._voidElapsed = 0;
        this._onArrive?.();
      }
      return;
    }

    if (this.state === 'void') {
      this._voidElapsed += delta;
      this._voidTime += delta;
      this._voidMaterial.uniforms.uTime.value = this._voidTime;
      if (this._voidElapsed >= VOID_DURATION && !this._holdVoidFlag) {
        this.state = 'idle';
        this.postFX.setWipeProgress(0);
        this.postFX.setIntensity(IDLE_INTENSITY);
      }
    }
  }

  renderVoid() {
    this.renderer.render(this._voidScene, this._voidCamera);
  }
}
