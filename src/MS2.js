import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

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
const listener = new THREE.AudioListener();
camera.add(listener);
const sound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();

audioLoader.load('/sound/MS2.mp3', function(buffer) {
  sound.setBuffer(buffer);
  sound.setLoop(true);
  sound.setVolume(0.5);
  sound.play();
});

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(labelRenderer.domElement);

camera.position.set(0, 5, 0);
camera.lookAt(0, 5, 10); 

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
        console.log(`Texture loaded successfully: ${path}`);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1,1);
        resolve(texture);
      },
      (xhr) => {
        console.log(`Texture ${path} loading: ${(xhr.loaded / xhr.total) * 100}%`);
      },
      (error) => {
        console.error(`Error loading texture ${path}:`, error);
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
  
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.09);
  roomGroup.add(ambientLight);
  
  const mainLight = new THREE.DirectionalLight(0xffffff, 0.09);
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

let imagePlane = null;

function addImageToBackWall() {
  const imagePath = '/photos/MSimages/MS2.webp';
  
  textureLoader.load(
    imagePath,
    (texture) => {
      createImagePlane(texture);
    },
    (xhr) => {
      console.log(`Image loading: ${(xhr.loaded / xhr.total) * 100}%`);
    },
    (error) => {
      console.error('Error loading image:', error);
      const altPaths = [
        '/photos/MSimages/MS2.png',
      ];
      
      tryAlternativeImagePaths(altPaths, 0);
    }
  );
}

function createImagePlane(texture) {
  const imageAspectRatio = texture.image.width / texture.image.height;
  
  const planeWidth = roomSize * 0.6;
  const planeHeight = planeWidth / imageAspectRatio;
  
  const planeGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
  
  const planeMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.5
  });
  
  imagePlane = new THREE.Mesh(planeGeometry, planeMaterial);
  
  imagePlane.position.set(0, roomHeight/2 - 3, roomSize/2 - wallThickness/2 - 0.5);
  imagePlane.rotation.y = Math.PI;
  
  scene.add(imagePlane);
  
  console.log('Image plane added successfully to the back wall');
}

function setImageOpacity(value) {
  if (imagePlane && imagePlane.material) {
    imagePlane.material.opacity = value;
  }
}

function tryAlternativeImagePaths(paths, index) {
  if (index >= paths.length) {
    console.error('Failed to load image from all paths');
    return;
  }
  
  textureLoader.load(
    paths[index],
    (texture) => {
      createImagePlane(texture);
    },
    (xhr) => {
      console.log(`Alternative image loading: ${(xhr.loaded / xhr.total) * 100}%`);
    },
    (error) => {
      console.error(`Error loading alternative image path ${paths[index]}:`, error);
      tryAlternativeImagePaths(paths, index + 1);
    }
  );
}

function imagePlane2() {
  const texturePath = '/photos/listenbutton.png';

  textureLoader.load(
    texturePath,
    (texture) => {
      const aspect = texture.image.width / texture.image.height;
      const width = 12;
      const height = width / aspect;

      const geometry = new THREE.PlaneGeometry(width, height);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.5,
      });

      const listenPlane = new THREE.Mesh(geometry, material);
      listenPlane.position.set(
        -roomSize / 2 + wallThickness / 2 + 0.01,
        roomHeight / 2 - 3,
        0
      );
      listenPlane.rotation.y = Math.PI / 2;

      scene.add(listenPlane);
    },
    undefined,
    (err) => {
      console.error('Failed to load listen button texture:', err);
    }
  );
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
      
      link.addEventListener('click', (event) => {
        console.log(`Link clicked: ${link.getAttribute('href')}`);
        console.log(`Link text: ${link.textContent}`);
      });
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

attemptTextureLoading();

addImageToBackWall();
imagePlane2();

addTextToWall(room.walls.right, `
<p>He planned this breathtaking party. There's an endless pour of New Californian wine. 
Gilded trays glide by like little ships, carrying hors d'oeuvres. A couple of his friends, 
electric violinists from the Neomodern Orchestra, play hauntingly beautiful renditions of 
songs I only half-recognize, but feel like they're meant just for this special moment. I 
pull out the compact he gave me and touch up my lipstick. My stomach flutters. Maybe it's 
the wine. Maybe it's the way he looks at me. Maybe it's just the novelty of <a href="MS3.html">being seen</a>, 
actually seen, without dollar signs in anyone's eyes. For once, I feel like I belong.</p>
`);

addTextToWall(room.walls.right, `
<p>..-..-..-..-..-..--..-..-..-..-..</p>
<p>..-..-..-..-..-..--..-..-..-..-..-..-..-..--..-..-..-..-..-..-..-..--..-..-..-..-..-..-..-..--..-..-..-..-..</p>
`);

const thinkTextLabel = addTextToWall(room.walls.left, `
  <p>-..<a href="#" id="think-link">THOUGHT</a>-.. ..-</p>
`);

const audio = new Audio('/sound/milesvoicebite1.mp3');

const thinkLink = thinkTextLabel.element.querySelector('#think-link');
if (thinkLink) {
  thinkLink.addEventListener('click', (event) => {
    event.preventDefault();
    audio.currentTime = 0;
    audio.play().catch(err => {
      console.error('Could not play sound:', err);
    });
  });
}

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
