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

const listener = new THREE.AudioListener();
camera.add(listener);

const sound = new THREE.Audio(listener);

const audioLoader = new THREE.AudioLoader();
audioLoader.load('/sound/MS3.mp3', function(buffer) {
  sound.setBuffer(buffer);
  sound.setLoop(true);
  sound.setVolume(1.0);
  sound.play();
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
  metalness: 0.2,
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
        metalness: 0.2
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
  
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.08);
  roomGroup.add(ambientLight);
  
  const mainLight = new THREE.DirectionalLight(0xffffff, 0.08);
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
      textLabel.position.set(0, 0, 0);
      break;
    case 'back':
      textLabel.position.set(0, 0, 0);
      break;
    case 'left':
      textLabel.position.set(0, 0, 0);
      textLabel.rotation.y = Math.PI / 2;
      break;
    case 'right':
      textLabel.position.set(0, 0, 0);
      textLabel.rotation.y = -Math.PI / 2;
      break;
  }

  wall.add(textLabel);
  return textLabel;
}

room = createRoom();
scene.add(room.group);

attemptTextureLoading();

addTextToWall(room.walls.front, `
  <p>▆er.-.,</p>
  <p>You thought you could hide this from me. I saw the e▆▆▆▆ stowed in your cupboard.</p>
  <p>The jewels and the pocket mirror. Then came the remnants of some fragrance in your apartment.</p>
  <p>I suppose I should have expected this day would come. I just can't make sense of it.</p>
  <p>Of her. Of you c▆osing her. After everything you told me - how you de▆▆d them, how</p>
  <p>they fucked you over too, how you swore you'd get ▆▆ at them some▆, somehow. And now</p>
  <p>you're ▆▆ h▆? I want to be angry. I should be. But I can't even ▆▆ my▆f. This is</p>
  <p>exactly what I dese▆. But tell me this - when you look at her, do you feel anything real?</p>
  <p>Have you lost your mind and convinced yourse▆ that you can rewrite the past?</p>
  <p>Don't even bother trying to call me. F▆get me. Forget us.</p>
`);

addTextToWall(room.walls.front, `
  <p>.. -- / .-.. --- ... .. -. --. / --- ..- - / --- -. / -.-- --- ..-</p>
  <p>.. -- / .-.. --- ... . ..-</p>
  <p>.. -- / .-.. --- ... .- / .-.. --- ... .- / .-.. --- ... . ..-</p>
`);

addTextToWall(room.walls.back, `
<p>I meet many of his friends all toge▆▆
there was a girl there I forget her name
she told me she liked my hair
she seemed to have a gentle per▆▆lity that I liked
how do you kn▆ her
I used to ▆▆ with her
where did you two used to ▆▆
she lost her ▆▆ it's a long story
where does she ▆▆ now
he didn't answer those questions and put his hand around my shoulder patt▆ it
like I said it's a lo▆ story
I'm laying here in bed staring at the ceiling
<a href="MS4.html">who is she</a>
I can't shake the thoug▆ of ▆▆</p>
`);

addTextToWall(room.walls.back, `
  <p>.... . / -.- .. .-.. .-.. . -.. / .... . .-. / .- -. -.. / -.- .. .-.. .-.. . -.. / .-- .... .- - / .-- . / .... .- -.. / - --- --. . - .... . .-.</p>
  `);

  addTextToWall(room.walls.left, `
  <p>.. -- / .-.. --- ... .. -. --. / --- ..- - / --- -. / -.-- --- ..-</p>
  <p> the cicada's cry drills into the husk then silence </p>
  <p> the cicada's cry drills into the hu▆ then ..- - / --- -. / -.-- - silence </p>
  <p> the cicada's cry drills into the husk then sil▆▆ the cicada's cry drills into the husk then silence the cicada's cry then silence</p>
  <p> the cicad▆▆ cry drills into the husk then silence </p>
  <p> the cicada's ..- - / --- -. / -.-- - cry ..- - / --- -. / -.-- - dril▆ into the husk then silence </p>
`);

 addTextToWall(room.walls.right, `
  <p>.. -- / .-.. --- ... .. -. --. / --- ..- - / --- -. / -.-- --- ..-</p>
  <p> such stillness the cries of the cicadas sink into the rocks into the rocks into the rocks into the rocks </p>
  <p> such still▆▆ the cries of the cicadas sink into the rocks such stilln▆▆ the cries of the cicadas sink into the rocks 
  <p> such stillness the cries of the cicad▆ ..- - / --- -. / -.-- - sink ..- - / --- -. / -.-- - into the rocks </p>
  <p> such stillness the cries of the cicadas sink into the rocks </p>
  <p> such stillness ..- - / --- -. / -.-- - the cries of the     she is a lotus blossoming in the <a href="MS5.html">sun</a>     cicadas sink into the rocks </p>
  <p> such stillness the cries of the cicadas sink into the rocks such stillness..- - / --- -. / -.-- -  the cries of the cicad▆ sink into the rocks 
  such stillness the cries of the cicadas sink into the rocks </p>
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