import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

const OFFSET = new THREE.Vector3(0.4, 0.35, 0);

// 3D-anchored callout: a CSS2DObject parented to the target object (so it
// follows automatically via the normal scene graph) plus a screen-space SVG
// line recomputed every frame from the box's nearest corner to the object.
export class CalloutBox {
  constructor() {
    this.css2dObject = null;
    this.anchor = null;
    this.targetObject = null;
    this.textEl = null;
    this.lineSvg = null;
    this.lineEl = null;
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

    this.lineSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    Object.assign(this.lineSvg.style, {
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      pointerEvents: 'none', zIndex: 5,
    });
    this.lineEl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    this.lineEl.setAttribute('stroke', '#ffffff');
    this.lineEl.setAttribute('stroke-width', '1');
    this.lineSvg.appendChild(this.lineEl);
    document.body.appendChild(this.lineSvg);

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

  update(camera, renderer) {
    if (!this.css2dObject || !this.lineEl || !this.targetObject) return;
    const size = renderer.getSize(new THREE.Vector2());
    const boxRect = this.css2dObject.element.getBoundingClientRect();

    const objWorldPos = new THREE.Vector3();
    this.targetObject.getWorldPosition(objWorldPos);
    const projected = objWorldPos.clone().project(camera);
    const objScreenX = (projected.x * 0.5 + 0.5) * size.x;
    const objScreenY = (-projected.y * 0.5 + 0.5) * size.y;

    const corners = [
      [boxRect.left, boxRect.top],
      [boxRect.right, boxRect.top],
      [boxRect.left, boxRect.bottom],
      [boxRect.right, boxRect.bottom],
    ];
    let nearest = corners[0];
    let bestDist = Infinity;
    for (const c of corners) {
      const d = (c[0] - objScreenX) ** 2 + (c[1] - objScreenY) ** 2;
      if (d < bestDist) { bestDist = d; nearest = c; }
    }
    this.lineEl.setAttribute('x1', nearest[0]);
    this.lineEl.setAttribute('y1', nearest[1]);
    this.lineEl.setAttribute('x2', objScreenX);
    this.lineEl.setAttribute('y2', objScreenY);
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
    if (this.lineSvg) {
      this.lineSvg.remove();
      this.lineSvg = null;
      this.lineEl = null;
    }
    this.targetObject = null;
  }
}
