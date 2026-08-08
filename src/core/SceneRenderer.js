import * as THREE from 'three';
import { createRoomShellMaterial } from '../render/materials/roomShellMaterial.js';
import { createDecayMaterial } from '../render/materials/decayMaterial.js';
import { createObjectMaterial } from '../render/materials/outlineMaterial.js';
import { buildObjectGeometry } from '../render/geometry/objects.js';
import { createAmbientTextLayer } from '../render/geometry/ambientText.js';
import { AudioCue } from './AudioCue.js';

const PORTAL_COUNTDOWN = 5.0;
const PORTAL_TRIGGER_RADIUS = 1.1;
const INTENSITY_IDLE = 0.05;
const INTENSITY_TYPING = 0.1;
const INTENSITY_COUNTDOWN_START = 0.1;
const INTENSITY_COUNTDOWN_END = 0.4;

// Builds/tears down a single scene's Three.js content from a scenes.js
// config entry: room shell, per-object geometry + outline + decay hole +
// callout + portal countdown wiring. One instance is reused across scene
// swaps (build/dispose), per the plan's full-teardown-per-scene approach.
export class SceneRenderer {
  constructor(scene, { calloutBox, postFX }) {
    this.scene = scene;
    this.calloutBox = calloutBox;
    this.postFX = postFX;
    this._disposables = [];
    this._objects = new Map();
    this._ambientLayer = null;
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

    (config.objects ?? []).forEach((objConfig, index) => {
      this._buildObject(objConfig, config.room.seed + index);
    });

    if (config.ambientText) {
      this._ambientLayer = createAmbientTextLayer(config.ambientText);
    }
  }

  _buildObject(objConfig, seed) {
    const outlineMaterial = createObjectMaterial();
    const group = buildObjectGeometry(objConfig.geometryType, outlineMaterial);
    group.position.set(...objConfig.position);
    group.userData.objectId = objConfig.id;
    this.scene.add(group);
    this._track(group, outlineMaterial);

    const decayMaterial = createDecayMaterial({ seed });
    const decayMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), decayMaterial);
    decayMesh.position.set(objConfig.position[0], objConfig.position[1], objConfig.position[2] - 0.35);
    this.scene.add(decayMesh);
    this._track(decayMesh, decayMaterial);

    this._objects.set(objConfig.id, {
      config: objConfig,
      group,
      outlineMaterial,
      decayMaterial,
      state: 'idle', // idle | typing | countdown | active
      countdownElapsed: 0,
    });
  }

  handleObjectClick(objectId) {
    if (this._activeObjectId) return;
    const entry = this._objects.get(objectId);
    if (!entry || entry.state !== 'idle') return;

    this._activeObjectId = objectId;
    entry.state = 'typing';
    entry.outlineMaterial.uniforms.uOutlineColor.value.set(0xff2b2b);
    this.postFX.setIntensity(INTENSITY_TYPING);

    const audioCue = new AudioCue(entry.config.audio, { fallbackDuration: 3.5 });
    this.calloutBox.show(entry.group, {
      captionText: entry.config.captionText,
      audioCue,
    }).then(() => {
      if (entry.state === 'typing') {
        entry.state = 'countdown';
        entry.countdownElapsed = 0;
      }
    });
  }

  update(delta, camera) {
    this._time += delta;

    for (const entry of this._objects.values()) {
      entry.outlineMaterial.uniforms.uTime.value = this._time;
      entry.decayMaterial.uniforms.uTime.value = this._time;

      if (entry.state === 'countdown') {
        entry.countdownElapsed += delta;
        const t = Math.min(entry.countdownElapsed / PORTAL_COUNTDOWN, 1);
        entry.decayMaterial.uniforms.uHoleFlush.value = t;
        this.postFX.setIntensity(THREE.MathUtils.lerp(INTENSITY_COUNTDOWN_START, INTENSITY_COUNTDOWN_END, t));

        if (entry.countdownElapsed >= PORTAL_COUNTDOWN) {
          entry.state = 'active';
        }
      } else if (entry.state === 'active') {
        entry.decayMaterial.uniforms.uHoleFlush.value = 1.0;
        const dist = camera.position.distanceTo(entry.group.position);
        if (dist <= PORTAL_TRIGGER_RADIUS) {
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
    this._ambientLayer?.dispose();
    this._ambientLayer = null;
    this._activeObjectId = null;
  }
}
