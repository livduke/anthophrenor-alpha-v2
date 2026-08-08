import * as THREE from 'three';
import endingImageUrl from '../assets/endingimage.png';

const FLY_DURATION = 1.2;
const VOID_DURATION = 0.6;
const IDLE_INTENSITY = 0.05;
const ENDING_IMAGE_ASPECT = 286 / 294;
const ENDING_IMAGE_ZOOM = 0.7;
const ENDING_IMAGE_BRIGHTNESS = 2.0;

function loadEndingTexture() {
  const texture = new THREE.TextureLoader().load(endingImageUrl);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// Ending artwork composited over the flat blue field by its own alpha
// channel, unfiltered — shown as-is.
function createVoidMaterial(width, height) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uImage: { value: loadEndingTexture() },
      uImageAspect: { value: ENDING_IMAGE_ASPECT },
      uResolution: { value: new THREE.Vector2(width, height) },
      uZoom: { value: ENDING_IMAGE_ZOOM },
      uBrightness: { value: ENDING_IMAGE_BRIGHTNESS },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uImage;
      uniform float uImageAspect;
      uniform vec2 uResolution;
      uniform float uZoom;
      uniform float uBrightness;
      varying vec2 vUv;

      void main() {
        float screenAspect = uResolution.x / uResolution.y;
        // "contain" ratio: scales the *shorter* screen axis down so the
        // whole image fits without cropping, then uZoom shrinks/grows it.
        vec2 containRatio = vec2(
          max(screenAspect / uImageAspect, 1.0),
          max(uImageAspect / screenAspect, 1.0)
        );
        vec2 imgUv = (vUv - 0.5) * containRatio / uZoom + 0.5;
        bool insideImage = imgUv.x >= 0.0 && imgUv.x <= 1.0 && imgUv.y >= 0.0 && imgUv.y <= 1.0;

        vec3 blue = vec3(0.0, 0.0, 1.0);
        vec3 color = blue;
        if (insideImage) {
          vec4 imgSample = texture2D(uImage, imgUv);
          vec3 brightened = min(imgSample.rgb * uBrightness, vec3(1.0));
          float alpha = min(imgSample.a * 1.2, 1.0);
          color = mix(blue, brightened, alpha);
        }

        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
}

// Drives the portal flythrough (camera lerps toward the hole while PostFX
// spikes), then a held void screen (ending artwork over flat blue), then
// hands off to onArrive (scene swap) before fading back to idle intensity.
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
    this._holdVoidFlag = false;

    const size = renderer.getSize(new THREE.Vector2());
    this._voidScene = new THREE.Scene();
    this._voidCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this._voidMaterial = createVoidMaterial(size.x, size.y);
    this._voidScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this._voidMaterial));
  }

  setSize(width, height) {
    this._voidMaterial.uniforms.uResolution.value.set(width, height);
  }

  get isActive() {
    return this.state !== 'idle';
  }

  get isVoid() {
    return this.state === 'void';
  }

  play(holeWorldPos, { skipHeld, onArrive, isEnding = false }) {
    if (this.state !== 'idle') return;
    this.state = 'flythrough';
    this._elapsed = 0;
    this._holdVoidFlag = false;
    this._isEnding = isEnding;
    this._startPos.copy(this.camera.position);
    this._targetPos.copy(holeWorldPos);
    this._skipHeldRef = skipHeld;
    this._onArrive = onArrive;
  }

  holdVoid() {
    this._holdVoidFlag = true;
  }

  // Pulls the controller out of a held void (used when returning to the
  // title screen from an ending) so a fresh playthrough starts clean.
  reset() {
    this.state = 'idle';
    this._holdVoidFlag = false;
    this.postFX.setWipeProgress(0);
    this.postFX.setIntensity(IDLE_INTENSITY);
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
        if (this._isEnding) {
          this.state = 'void';
          this._voidElapsed = 0;
          this._onArrive?.();
        } else {
          // Normal scene-to-scene hop: cut straight back to idle, no
          // void hold — that's reserved for the real ending screens.
          this.state = 'idle';
          this.postFX.setWipeProgress(0);
          this.postFX.setIntensity(IDLE_INTENSITY);
          this._onArrive?.();
        }
      }
      return;
    }

    if (this.state === 'void') {
      this._voidElapsed += delta;
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
