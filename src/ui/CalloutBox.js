import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

const OFFSET = new THREE.Vector3(0.4, 0.35, 0);

// 3D-anchored callout: a CSS2DObject parented to the target object, so it
// follows automatically via the normal scene graph.
export class CalloutBox {
  constructor() {
    this.css2dObject = null;
    this.anchor = null;
    this.targetObject = null;
    this.textEl = null;
    this._typing = null;
  }

  show(object3D, { captionText, audioCue }) {
    this.hide();
    this.targetObject = object3D;

    const el = document.createElement('div');
    el.className = 'callout-box';
    el.innerHTML = '<span class="callout-text"></span>';
    this.textEl = el.querySelector('.callout-text');

    this.css2dObject = new CSS2DObject(el);
    this.anchor = new THREE.Object3D();
    this.anchor.position.copy(OFFSET);
    object3D.add(this.anchor);
    this.anchor.add(this.css2dObject);

    const durationMs = (audioCue?.duration ?? 3.5) * 1000;
    audioCue?.play();
    return this.typeText(captionText, durationMs);
  }

  typeText(text, durationMs) {
    return new Promise((resolve) => {
      if (this._typing) clearInterval(this._typing);
      let i = 0;
      const interval = Math.max(durationMs / Math.max(text.length, 1), 16);
      this.textEl.textContent = '';
      this._typing = setInterval(() => {
        i += 1;
        this.textEl.textContent = text.slice(0, i);
        if (i >= text.length) {
          clearInterval(this._typing);
          this._typing = null;
          resolve();
        }
      }, interval);
    });
  }

  hide() {
    if (this._typing) {
      clearInterval(this._typing);
      this._typing = null;
    }
    if (this.css2dObject && this.anchor) {
      this.anchor.remove(this.css2dObject);
      this.targetObject?.remove(this.anchor);
    }
    this.css2dObject = null;
    this.anchor = null;
    this.targetObject = null;
  }
}
