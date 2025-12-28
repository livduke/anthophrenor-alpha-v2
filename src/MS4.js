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
camera.lookAt(10, 5, 0);

const listener = new THREE.AudioListener();
camera.add(listener);
const sound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();
audioLoader.load(
  '/sound/MS4.mp3',
  function(buffer) {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(0.5);
    sound.play();
    console.log('urban noise is playing');
  },
  function(xhr) {
    console.log('Audio ' + (xhr.loaded / xhr.total * 100) + '% loaded');
  },
  function(error) {
    console.error('Error loading audio:', error);
    tryAlternateAudioPaths();
  }
);

function tryAlternateAudioPaths() {
  const audioPaths = ['/sound/MS4.mp3'];
  let pathIndex = 0;

  function tryNextPath() {
    if (pathIndex >= audioPaths.length) {
      console.error('Failed to load audio from all paths');
      return;
    }

    const path = audioPaths[pathIndex];
    console.log(`Trying to load audio from: ${path}`);

    audioLoader.load(
      path,
      function(buffer) {
        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setVolume(0.2);
        sound.play();
        console.log(`Successfully loaded audio from path: ${path}`);
      },
      function(xhr) {
        console.log('Audio ' + (xhr.loaded / xhr.total * 100) + '% loaded');
      },
      function(error) {
        console.error(`Failed to load audio from path: ${path}`, error);
        pathIndex++;
        tryNextPath();
      }
    );
  }

  tryNextPath();
}

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

const texturePaths = ['/photos/MSimages/MStexture.png'];

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
  
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.07);
  roomGroup.add(ambientLight);
  
  const mainLight = new THREE.DirectionalLight(0xffffff, 0.07);
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
  textDiv.style.fontSize = '20px';
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

function addImageToWall(wall, imagePath, width = 10, height = 10) {
  return new Promise((resolve, reject) => {
    textureLoader.load(
      imagePath,
      (texture) => {
        const imageGeometry = new THREE.PlaneGeometry(width, height);
        const imageMaterial = new THREE.MeshBasicMaterial({ 
          map: texture, 
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.5,
        });
        
        const imagePlane = new THREE.Mesh(imageGeometry, imageMaterial);
        
        const wallId = wall.userData.wallId;
        switch (wallId) {
          case 'front':
            imagePlane.position.set(0, roomHeight/2, wallThickness/2 + 0.05);
            break;
          case 'back':
            imagePlane.position.set(0, roomHeight/2, -wallThickness/2 - 0.05);
            imagePlane.rotation.y = Math.PI;
            break;
          case 'left':
            imagePlane.position.set(wallThickness/2 + 0.05, roomHeight/2, 0);
            imagePlane.rotation.y = -Math.PI / 2;
            break;
          case 'right':
            imagePlane.position.set(-wallThickness/2 - 0.1, -roomHeight/2 + 6, 0);
            imagePlane.rotation.y = -Math.PI / 2;
            break;
        }
        
        wall.add(imagePlane);
        console.log(`Image added to ${wallId} wall: ${imagePath}`);
        resolve(imagePlane);
      },
      (xhr) => {
        console.log(`Image ${imagePath} loading: ${(xhr.loaded / xhr.total) * 100}%`);
      },
      (error) => {
        console.error(`Error loading image ${imagePath}:`, error);
        reject(error);
      }
    );
  });
}

room = createRoom();
scene.add(room.group);

attemptTextureLoading();

addImageToWall(room.walls.right, '/photos/MSimages/MS4.webp', 15, 10)
  .then(imagePlane => {
    console.log('Image plane added successfully to right wall');
  })
  .catch(error => {
    console.error('Failed to add image plane:', error);
  });

addTextToWall(room.walls.back, `
<p>I ju▆ want my ▆▆▆ I want my ▆▆▆ I want my ▆▆▆ where is she
it's really happeni▆ red everywhere red red red red red red there's no going back now some▆▆ in the corner of ▆ ▆▆
crack▆ ▆▆ the door it's not just ▆ and h▆ he▆ red I want to <a href="MS5.html">scream</a> to tell that per▆▆ to ▆▆ I'm losing my breath
everything slow▆ I see visions of all that I once was sleeping upon my mother's shoulder haziness of youth
growing pains sl▆▆ red everywhere a brig▆ light shines through my eyelids</p>
`);

addTextToWall(room.walls.back, `
<p>. .-. / .- -. RED RED RED-. .-. / .- -. -. .-. / .- -. -. .-. / .- -. -. .-.  -. -. -. -. -. -. -. -. -. -./ .- -.</p>
<p>/ .- -. -. .-. / .- -. -. .-. / .- -                             / .- -./ .- -./ .- -./ .- -./ .- -. -. .-. -. .-. -. .-.</p>
<P> RED RED RED RED RED RED RED RED </p>
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