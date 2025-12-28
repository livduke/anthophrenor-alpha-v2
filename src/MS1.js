import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

const sceneOverlay = document.createElement('div');
sceneOverlay.style.position = 'fixed';
sceneOverlay.style.top = '0';
sceneOverlay.style.left = '0';
sceneOverlay.style.width = '100%';
sceneOverlay.style.height = '100%';
sceneOverlay.style.backgroundColor = '#000';
sceneOverlay.style.zIndex = '9999';
sceneOverlay.style.transition = 'opacity 1.5s ease-out';
document.body.appendChild(sceneOverlay);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

let audioListener = new THREE.AudioListener();
camera.add(audioListener);

const sound = new THREE.Audio(audioListener);

const audioLoader = new THREE.AudioLoader();
audioLoader.load('/sound/MS1whisper.mp3', function(buffer) {
  sound.setBuffer(buffer);
  sound.setLoop(true);
  sound.setVolume(0.5);
  sound.play();
}, undefined, (error) => {
  console.error('Error loading audio:', error);
});

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(labelRenderer.domElement);

camera.position.set(0, 5, 0);
camera.lookAt(0, 5, -10);

const roomSize = 20;
const roomHeight = 18;
const wallThickness = 0.5;

const textureLoader = new THREE.TextureLoader();

const defaultMaterial = new THREE.MeshStandardMaterial({ 
  color: 0x00008B,
  roughness: 0.7,
  metalness: 0.2
});

let roomMaterial = defaultMaterial;

function loadTexture(path) {
  return new Promise((resolve, reject) => {
    textureLoader.load(
      path,
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1,1);
        resolve(texture);
      },
      undefined,
      (error) => {
        reject(error);
      }
    );
  });
}

const texturePaths = [
  '/photos/MSimages/MStexture.png'
];

async function attemptTextureLoading() {
  for (const path of texturePaths) {
    try {
      const texture = await loadTexture(path);
      roomMaterial = new THREE.MeshStandardMaterial({ 
        map: texture,
        roughness: 0.7,
        metalness: 0.2
      });
      updateRoomMaterials();
      break;
    } catch (error) {
      continue;
    }
  }
}

let room;

function createRoom() {
  const roomGroup = new THREE.Group();

  const floorGeometry = new THREE.BoxGeometry(roomSize, wallThickness, roomSize);
  const floor = new THREE.Mesh(floorGeometry, roomMaterial);
  floor.position.y = -wallThickness/2;
  floor.receiveShadow = true;
  roomGroup.add(floor);

  const wall1Geometry = new THREE.BoxGeometry(roomSize, roomHeight, wallThickness);
  const wall1 = new THREE.Mesh(wall1Geometry, roomMaterial);
  wall1.position.set(0, roomHeight/2, -roomSize/2);
  wall1.receiveShadow = true;
  wall1.castShadow = true;
  wall1.userData = { wallId: 'front' };
  roomGroup.add(wall1);

  const wall2 = wall1.clone();
  wall2.position.z = roomSize/2;
  wall2.userData = { wallId: 'back' };
  roomGroup.add(wall2);

  const wall3Geometry = new THREE.BoxGeometry(wallThickness, roomHeight, roomSize);
  const wall3 = new THREE.Mesh(wall3Geometry, roomMaterial);
  wall3.position.set(-roomSize/2, roomHeight/2, 0);
  wall3.receiveShadow = true;
  wall3.castShadow = true;
  wall3.userData = { wallId: 'left' };
  roomGroup.add(wall3);

  const wall4 = wall3.clone();
  wall4.position.x = roomSize/2;
  wall4.userData = { wallId: 'right' };
  roomGroup.add(wall4);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
  roomGroup.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, 0.1);
  mainLight.position.set(0, 15, 0);
  mainLight.castShadow = true;
  mainLight.shadow.mapSize.width = 2048;
  mainLight.shadow.mapSize.height = 2048;
  roomGroup.add(mainLight);

  return {
    group: roomGroup,
    walls: {
      front: wall1,
      back: wall2,
      left: wall3,
      right: wall4
    }
  };
}

function updateRoomMaterials() {
  if (!room) return;
  room.group.children.forEach(child => {
    if (child.isMesh) {
      child.material = roomMaterial;
    }
  });
  renderer.render(scene, camera);
}

function addTextToWall(wall, textContent) {
  const textDiv = document.createElement('div');
  textDiv.className = 'wall-text';
  textDiv.style.width = '1000px';
  textDiv.style.padding = '20px';
  textDiv.style.color = 'white';
  textDiv.style.borderRadius = '10px';
  textDiv.style.fontFamily = 'Arial, sans-serif';
  textDiv.style.fontSize = '18px';
  textDiv.style.pointerEvents = 'auto'; 
  textDiv.innerHTML = textContent;

  setTimeout(() => {
    const links = textDiv.querySelectorAll('a');
    links.forEach(link => {
      link.style.color = '#0808fc';
      link.style.textDecoration = 'none';
      link.style.cursor = 'pointer';
    });
  }, 100);

  const textLabel = new CSS2DObject(textDiv);
  const wallId = wall.userData.wallId;
  switch (wallId) {
    case 'front':
      textLabel.position.set(0, 0, 0.1);
      break;
    case 'back':
      textLabel.position.set(0, 0, -0.1);
      break;
    case 'left':
      textLabel.position.set(0.1, 0, 0);
      textLabel.rotation.y = Math.PI / 2;
      break;
    case 'right':
      textLabel.position.set(-0.1, 0, 0);
      textLabel.rotation.y = -Math.PI / 2;
      break;
  }
  wall.add(textLabel);
  return textLabel;
}

room = createRoom();
scene.add(room.group);

const imageTexture = textureLoader.load('/photos/MSimages/MS1.webp', (texture) => {
  const imageWidth = 15;
  const imageHeight = 10;

  const imageMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.FrontSide,
    transparent: true,
    opacity: 0.5,
  });

  const imagePlane = new THREE.Mesh(new THREE.PlaneGeometry(imageWidth, imageHeight), imageMaterial);

  imagePlane.position.set(roomSize / 2 - wallThickness / 2 - 0.01, imageHeight / 2 + 1, 0);
  imagePlane.rotation.y = -Math.PI / 2;

  scene.add(imagePlane);
});

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

const glitchChairs = [];

gltfLoader.load('/models/MSmodels/MS1.glb', (gltf) => {
  const model = gltf.scene;
  model.position.set(0, 0.4, 0);
  model.scale.set(8, 8, 8);
  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  scene.add(model);
}, undefined, (error) => {
  console.error('Error loading MS1.glb:', error);
});

gltfLoader.load('/models/MSmodels/MS1_2.glb', (gltf) => {
  const baseModel = gltf.scene;

  const chairPositions = [
    { x: 5.5, y: 2.5, z: 9, rotX: Math.PI / 0.58, rotY: Math.PI / 1.3 },
    { x: 3, y: 1.5, z: 6, rotX: Math.PI / 0.56, rotY: Math.PI / 1.02 },
    { x: 7, y: 2.5, z: 12, rotX: Math.PI / 0.54, rotY: Math.PI / 3 },
  ];

  chairPositions.forEach((pos, index) => {
    const chair = baseModel.clone(true);
    chair.position.set(pos.x, pos.y, pos.z);
    chair.rotation.set(pos.rotX, pos.rotY, 0);
    chair.scale.set(9, 9, 9);

    chair.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    glitchChairs.push(chair);
    scene.add(chair);
  });
}, undefined, (error) => {
  console.error('Error loading MS1_2.glb:', error);
});

attemptTextureLoading();

addTextToWall(room.walls.front, `
  <p><a href="MS3.html">Nobody</a> can hear us from <a href="MS2.html">here</a>, Scarlett.</p>
`);

let isAltPressed = false;
let isRotating = false;
let previousMouseX = 0;
let rotationSpeed = 0.01;

document.addEventListener('keydown', (event) => {
  if (event.key === 'Alt') {
    isAltPressed = true;
  }
});

document.addEventListener('keyup', (event) => {
  if (event.key === 'Alt') {
    isAltPressed = false;
    isRotating = false;
  }
});

document.addEventListener('mousedown', (event) => {
  if (isAltPressed) {
    isRotating = true;
    previousMouseX = event.clientX;
  }
});

document.addEventListener('mouseup', () => {
  isRotating = false;
});

document.addEventListener('mousemove', (event) => {
  if (isRotating && isAltPressed) {
    const deltaX = event.clientX - previousMouseX;
    camera.rotation.y += deltaX * rotationSpeed;
    previousMouseX = event.clientX;
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);

  glitchChairs.forEach((chair) => {
    chair.rotation.x += (Math.random() - 0.5) * 0.003;
    chair.rotation.y += (Math.random() - 0.5) * 0.003;
    chair.position.x += (Math.random() - 0.5) * 0.005;
    chair.position.y += (Math.random() - 0.5) * 0.005;
  });

  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

function startScene() {
  animate();
  setTimeout(() => {
    sceneOverlay.style.opacity = '0';
    setTimeout(() => {
      sceneOverlay.style.display = 'none';
    }, 5000);
  }, 5000);
}

startScene();