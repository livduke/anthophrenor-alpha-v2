import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

const sceneOverlay = document.createElement('div');
sceneOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background-color:#000;z-index:9999;transition:opacity 1.5s ease-out';
document.body.appendChild(sceneOverlay);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const listener = new THREE.AudioListener();
camera.add(listener);
const sound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();

audioLoader.load('/sound/SE1.mp3', buffer => {
  sound.setBuffer(buffer);
  sound.setLoop(true);
  sound.setVolume(0.5);
  sound.play();
  console.log('Bird sounds playing');
}, xhr => console.log('Audio ' + (xhr.loaded / xhr.total * 100) + '% loaded'), error => {
  console.error('Error loading audio:', error);
  tryAlternateAudioPaths();
});

function tryAlternateAudioPaths() {
  const audioPaths = ['sound/birds.mp3'];
  let pathIndex = 0;

  function tryNextPath() {
    if (pathIndex >= audioPaths.length) {
      console.error('Failed to load audio from all paths');
      return;
    }
    const path = audioPaths[pathIndex];
    console.log(`Trying to load audio from: ${path}`);
    audioLoader.load(path, buffer => {
      sound.setBuffer(buffer);
      sound.setLoop(true);
      sound.setVolume(0.2);
      sound.play();
      console.log(`Successfully loaded audio from path: ${path}`);
    }, xhr => console.log('Audio ' + (xhr.loaded / xhr.total * 100) + '% loaded'), error => {
      console.error(`Failed to load audio from path: ${path}`, error);
      pathIndex++;
      tryNextPath();
    });
  }
  tryNextPath();
}

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.cssText = 'position:absolute;top:0px;pointer-events:none';
document.body.appendChild(labelRenderer.domElement);

camera.position.set(0, 5, 0);
camera.lookAt(10, 5, 0);

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
let room;

function loadTexture(path) {
  return new Promise((resolve, reject) => {
    textureLoader.load(path, texture => {
      console.log(`Texture loaded successfully: ${path}`);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1,1);
      resolve(texture);
    }, xhr => console.log(`Texture ${path} loading: ${(xhr.loaded / xhr.total) * 100}%`), error => {
      console.error(`Error loading texture ${path}:`, error);
      reject(error);
    });
  });
}

const texturePaths = ['/photos/SEimages/SEtexture.png'];

async function attemptTextureLoading() {
  for (const path of texturePaths) {
    try {
      const texture = await loadTexture(path);
      roomMaterial = new THREE.MeshStandardMaterial({ 
        map: texture,
        roughness: 0.7,
        metalness: 0.2,
      });
      console.log(`Successfully loaded texture from path: ${path}`);
      updateRoomMaterials();
      break;
    } catch (error) {
      console.warn(`Failed to load texture from path: ${path}`);
    }
  }
}

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
  textDiv.style.cssText = 'width:1000px;padding:25px;color:white;border-radius:10px;font-family:Arial,sans-serif;font-size:20px;pointer-events:auto;opacity:0;transition:opacity 2.5s ease-in-out';
  textDiv.innerHTML = textContent;

  setTimeout(() => {
    const links = textDiv.querySelectorAll('a');
    links.forEach(link => {
      link.style.cssText = 'color:#FF0000;text-decoration:none;cursor:pointer';
      link.addEventListener('click', event => {
        console.log(`Link clicked: ${link.getAttribute('href')}`);
        console.log(`Link text: ${link.textContent}`);
      });
    });
  }, 100);

  const textLabel = new CSS2DObject(textDiv);
  const wallId = wall.userData.wallId;

  switch (wallId) {
    case 'front':
    case 'back':
    case 'left':
    case 'right':
      textLabel.position.set(0, 0, 0);
      break;
  }

  wall.add(textLabel);

  setTimeout(() => {
    textDiv.style.opacity = '1';
  }, 6000);

  return textLabel;
}

room = createRoom();
scene.add(room.group);
attemptTextureLoading();

addTextToWall(room.walls.front, `
  <p>On the corner of South Pine and China Street is where it is. I <a href="SE3.html">remember</a> it well. 
  Velvet wine-colored trays lined with silver, gold, and pearls glint behind smudged 
  glass. When I push the door open, the bell clanks sharply and a surge of sweltering 
  summer air collides with the freezing blast of the air con. It smells faintly 
  of rubbing alcohol and lavender. That red-headed woman behind the counter is there again 
  and raises her eyebrows when she looks up from her book and sees me.</p>
`);

addTextToWall(room.walls.back, `
  <p>I picked up on how she's an eclectic collector, timesick for old world charm. 
  She's someone who keeps a heap of moth-eaten retro books surrounded by her newest 
  Denkirhiza gadgets. I've showered her with gifts from around town. This time, though, 
  I'm getting her something special - a compact mirror with one of my drawings engraved 
  on it. I pull the sketch from my pocket, unfold it, and slide it over to the red-headed 
  woman. The image sends a <a href="SE2.html">shiver</a> down my spine 
  if I linger on it too long.</p>
`);

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

gltfLoader.load('/models/SEmodels/SE1_3.glb', gltf => {
  const model = gltf.scene;
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.sub(center);
  model.scale.set(3, 3, 3);
  model.position.set(7, 8, -6);
  model.rotation.y = -Math.PI / 8;

  model.traverse(child => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  scene.add(model);
  renderer.render(scene, camera);
  console.log("SE1_3.glb model loaded successfully with DRACO compression");
}, xhr => {
  if (xhr.total > 0) {
    console.log(`SE1_3.glb loading: ${(xhr.loaded / xhr.total) * 100}%`);
  }
}, error => {
  console.error('Error loading DRACO GLB model:', error);
});

let isAltPressed = false;
let isRotating = false;
let previousMouseX = 0;
const rotationSpeed = 0.01;

document.addEventListener('keydown', event => {
  if (event.key === 'Alt') {
    isAltPressed = true;
  }
});

document.addEventListener('keyup', event => {
  if (event.key === 'Alt') {
    isAltPressed = false;
    isRotating = false;
  }
});

document.addEventListener('mousedown', event => {
  if (isAltPressed) {
    isRotating = true;
    previousMouseX = event.clientX;
  }
});

document.addEventListener('mouseup', () => {
  isRotating = false;
});

document.addEventListener('mousemove', event => {
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