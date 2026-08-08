import * as THREE from 'three';

// Simple stylized (not literal) primitive builders. Each returns a
// THREE.Group; materials are applied by the caller (SceneRenderer) so a
// single outline material instance/uniform set can drive click state.

function phone(material) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.45, 0.03), material);
  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.36, 0.01), material);
  screen.position.z = 0.02;
  group.add(body, screen);
  return group;
}

function chair(material) {
  const group = new THREE.Group();
  const legGeo = new THREE.BoxGeometry(0.04, 0.4, 0.04);
  const legOffsets = [
    [0.18, -0.2, 0.18],
    [-0.18, -0.2, 0.18],
    [0.18, -0.2, -0.18],
    [-0.18, -0.2, -0.18],
  ];
  for (const [x, y, z] of legOffsets) {
    const leg = new THREE.Mesh(legGeo, material);
    leg.position.set(x, y, z);
    group.add(leg);
  }
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.42), material);
  seat.position.y = 0.02;
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.4, 0.04), material);
  back.position.set(0, 0.24, -0.19);
  group.add(seat, back);
  return group;
}

function mug(material) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.2, 16), material);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 8, 16, Math.PI), material);
  handle.rotation.z = Math.PI / 2;
  handle.position.set(0.18, 0, 0);
  group.add(body, handle);
  return group;
}

function box(material) {
  const group = new THREE.Group();
  const crate = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.4), material);
  group.add(crate);
  return group;
}

const BUILDERS = { phone, chair, mug, box };

export function buildObjectGeometry(geometryType, material) {
  const builder = BUILDERS[geometryType];
  if (!builder) {
    throw new Error(`Unknown geometryType "${geometryType}"`);
  }
  return builder(material);
}
