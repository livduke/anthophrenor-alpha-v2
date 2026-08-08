import * as THREE from 'three';
import { createRoomShellMaterial } from '../render/materials/roomShellMaterial.js';
import { createObjectMaterial } from '../render/materials/outlineMaterial.js';
import { buildObjectGeometry } from '../render/geometry/objects.js';
import { AudioCue } from './AudioCue.js';

const PORTAL_COUNTDOWN = 5.0;
const INTENSITY_IDLE = 0.05;
const INTENSITY_COUNTDOWN_START = 0.1;
const INTENSITY_COUNTDOWN_END = 0.4;

// Builds/tears down a single scene's Three.js content from a scenes.js
// config entry: room shell, per-object geometry + outline + callout +
// portal countdown wiring. One instance is reused across scene swaps
// (build/dispose), per the plan's full-teardown-per-scene approach.
export class SceneRenderer {
  constructor(scene, { calloutBox, postFX }) {
    this.scene = scene;
    this.calloutBox = calloutBox;
    this.postFX = postFX;
    this._disposables = [];
    this._objects = new Map();
    this._onPortalFire = null;
    this._activeObjectId = null;
    this._time = 0;
  }

  onPortalFire(callback) {
    this._onPortalFire = callback;
  }

  getClickTargets() {
    return Array.from(this._objects.values()).map((o) => o.group);
  }

  build(config) {
    this._time = 0;
    const [w, h, d] = config.room.size;

    const shellMaterial = createRoomShellMaterial();
    const shell = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), shellMaterial);
    shell.position.set(0, h / 2, 0);
    this.scene.add(shell);
    this._track(shell, shellMaterial);

    (config.objects ?? []).forEach((objConfig) => {
      this._buildObject(objConfig);
    });
  }

  _buildObject(objConfig) {
    const outlineMaterial = createObjectMaterial();
    const group = buildObjectGeometry(objConfig.geometryType, outlineMaterial);
    group.position.set(...objConfig.position);
    group.userData.objectId = objConfig.id;
    this.scene.add(group);
    this._track(group, outlineMaterial);

    this._objects.set(objConfig.id, {
      config: objConfig,
      group,
      outlineMaterial,
      state: 'idle', // idle | countdown | firing
      countdownElapsed: 0,
    });
  }

  handleObjectClick(objectId) {
    if (this._activeObjectId) return;
    const entry = this._objects.get(objectId);
    if (!entry || entry.state !== 'idle') return;

    this._activeObjectId = objectId;
    entry.state = 'countdown';
    entry.countdownElapsed = 0;
    entry.outlineMaterial.uniforms.uOutlineColor.value.set(0xff2b2b);
    this.postFX.setIntensity(INTENSITY_COUNTDOWN_START);

    const audioCue = new AudioCue(entry.config.audio, { fallbackDuration: 3.5 });
    this.calloutBox.show(entry.group, {
      captionText: entry.config.captionText,
      audioCue,
    });
  }

  update(delta) {
    this._time += delta;

    for (const entry of this._objects.values()) {
      entry.outlineMaterial.uniforms.uTime.value = this._time;

      if (entry.state === 'countdown') {
        entry.countdownElapsed += delta;
        const t = Math.min(entry.countdownElapsed / PORTAL_COUNTDOWN, 1);
        this.postFX.setIntensity(THREE.MathUtils.lerp(INTENSITY_COUNTDOWN_START, INTENSITY_COUNTDOWN_END, t));

        if (entry.countdownElapsed >= PORTAL_COUNTDOWN) {
          entry.state = 'firing';
          this.calloutBox.hide();
          const worldPos = entry.group.position.clone();
          this._onPortalFire?.(entry.config.id, entry.config.leadsTo, worldPos);
        }
      }
    }
  }

  _track(mesh, material) {
    this._disposables.push({ mesh, geometry: mesh.geometry, material });
  }

  dispose() {
    for (const { mesh, geometry, material } of this._disposables) {
      this.scene.remove(mesh);
      geometry?.dispose();
      material?.dispose();
    }
    this._disposables = [];
    this._objects.clear();
    this.calloutBox.hide();
    this._activeObjectId = null;
  }
}
