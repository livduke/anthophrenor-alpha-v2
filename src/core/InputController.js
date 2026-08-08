import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

const DAMPING = 8.0;
const ACCEL = 40.0;
const WALL_MARGIN = 0.4;

export class InputController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.controls = new PointerLockControls(camera, domElement);

    this.velocity = new THREE.Vector3();
    this.move = { forward: false, backward: false, left: false, right: false };
    this.skipHeld = false;
    this.bounds = null;
    this.clickTargets = [];
    this._onObjectClick = null;

    this._raycaster = new THREE.Raycaster();
    this._center = new THREE.Vector2(0, 0);

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onClick = this._onClick.bind(this);

    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);
    domElement.addEventListener('click', this._onClick);
  }

  requestLock() {
    this.controls.lock();
  }

  get isLocked() {
    return this.controls.isLocked;
  }

  setBounds(size) {
    const [w, , d] = size;
    this.bounds = { halfW: w / 2 - WALL_MARGIN, halfD: d / 2 - WALL_MARGIN };
  }

  setClickTargets(objects) {
    this.clickTargets = objects;
  }

  onObjectClick(callback) {
    this._onObjectClick = callback;
  }

  _onKeyDown(e) {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp': this.move.forward = true; break;
      case 'KeyS': case 'ArrowDown': this.move.backward = true; break;
      case 'KeyA': case 'ArrowLeft': this.move.left = true; break;
      case 'KeyD': case 'ArrowRight': this.move.right = true; break;
      case 'Space': this.skipHeld = true; break;
    }
  }

  _onKeyUp(e) {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp': this.move.forward = false; break;
      case 'KeyS': case 'ArrowDown': this.move.backward = false; break;
      case 'KeyA': case 'ArrowLeft': this.move.left = false; break;
      case 'KeyD': case 'ArrowRight': this.move.right = false; break;
      case 'Space': this.skipHeld = false; break;
    }
  }

  _onClick() {
    if (!this.controls.isLocked) {
      this.requestLock();
      return;
    }
    if (!this._onObjectClick || this.clickTargets.length === 0) return;
    this._raycaster.setFromCamera(this._center, this.camera);
    const hits = this._raycaster.intersectObjects(this.clickTargets, true);
    if (hits.length > 0) {
      let obj = hits[0].object;
      while (obj && !obj.userData.objectId) obj = obj.parent;
      if (obj) this._onObjectClick(obj.userData.objectId);
    }
  }

  update(delta) {
    if (!this.controls.isLocked) return;

    this.velocity.x -= this.velocity.x * DAMPING * delta;
    this.velocity.z -= this.velocity.z * DAMPING * delta;

    const forwardInput = Number(this.move.forward) - Number(this.move.backward);
    const rightInput = Number(this.move.right) - Number(this.move.left);

    if (forwardInput !== 0) this.velocity.z -= forwardInput * ACCEL * delta;
    if (rightInput !== 0) this.velocity.x += rightInput * ACCEL * delta;

    this.controls.moveRight(this.velocity.x * delta);
    this.controls.moveForward(-this.velocity.z * delta);

    if (this.bounds) {
      const obj = this.controls.object;
      obj.position.x = THREE.MathUtils.clamp(obj.position.x, -this.bounds.halfW, this.bounds.halfW);
      obj.position.z = THREE.MathUtils.clamp(obj.position.z, -this.bounds.halfD, this.bounds.halfD);
    }
  }

  dispose() {
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup', this._onKeyUp);
    this.domElement.removeEventListener('click', this._onClick);
    this.controls.dispose();
  }
}
