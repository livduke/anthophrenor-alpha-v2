import * as THREE from 'three';

// Flat solid BSOD-blue shell used for room walls/floor/ceiling. Single flat
// color, no gradient/dithering, so every room reads identically.
export function createRoomShellMaterial({
  color = new THREE.Color(0x0000ff),
} = {}) {
  return new THREE.MeshBasicMaterial({
    color,
    side: THREE.BackSide,
  });
}
