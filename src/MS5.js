import * as THREE from 'three'; 
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

const sceneOverlay = document.createElement('div');
Object.assign(sceneOverlay.style, {
  position: 'fixed',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  backgroundColor: '#000',
  zIndex: '9999',
  transition: 'opacity 1.5s ease-out'
});
document.body.appendChild(sceneOverlay);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
Object.assign(labelRenderer.domElement.style, {
  position: 'absolute',
  top: '0px',
  pointerEvents: 'none'
});
document.body.appendChild(labelRenderer.domElement);

const listener = new THREE.AudioListener();
camera.add(listener);
const sound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();

function tryAlternateAudioPaths() {
  const audioPaths = ['/sound/MS5.mp3'];
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

audioLoader.load(
  '/sound/MS5.mp3',
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
const tremblingModels = [];

function loadTexture(path) {
  return new Promise((resolve, reject) => {
    textureLoader.load(
      path,
      (texture) => {
        console.log(`Texture loaded successfully: ${path}`);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        resolve(texture);
      },
      undefined,
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
  floor.position.y = -wallThickness / 2;
  floor.receiveShadow = true;
  roomGroup.add(floor);
  
  const wall1Geometry = new THREE.BoxGeometry(roomSize, roomHeight, wallThickness);
  const wall1 = new THREE.Mesh(wall1Geometry, roomMaterial);
  wall1.position.set(0, roomHeight / 2, -roomSize / 2);
  wall1.receiveShadow = true;
  wall1.castShadow = true;
  wall1.userData = { wallId: 'front' };
  roomGroup.add(wall1);
  
  const wall2 = wall1.clone();
  wall2.position.z = roomSize / 2;
  wall2.userData = { wallId: 'back' };
  roomGroup.add(wall2);
  
  const wall3Geometry = new THREE.BoxGeometry(wallThickness, roomHeight, roomSize);
  const wall3 = new THREE.Mesh(wall3Geometry, roomMaterial);
  wall3.position.set(-roomSize / 2, roomHeight / 2, 0);
  wall3.receiveShadow = true;
  wall3.castShadow = true;
  wall3.userData = { wallId: 'left' };
  roomGroup.add(wall3);
  
  const wall4 = wall3.clone();
  wall4.position.x = roomSize / 2;
  wall4.userData = { wallId: 'right' };
  roomGroup.add(wall4);
  
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.06);
  roomGroup.add(ambientLight);
  
  const mainLight = new THREE.DirectionalLight(0xffffff, 0.06);
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
  Object.assign(textDiv.style, {
    width: '1000px',
    padding: '20px',
    color: 'white',
    borderRadius: '10px',
    fontFamily: 'Arial, sans-serif',
    fontSize: '20px',
    pointerEvents: 'auto'
  });
  textDiv.innerHTML = textContent;

  setTimeout(() => {
    const links = textDiv.querySelectorAll('a');
    links.forEach(link => {
      Object.assign(link.style, {
        color: '#0808fc',
        textDecoration: 'none',
        cursor: 'pointer'
      });
      link.addEventListener('click', (event) => {
        console.log(`Link clicked: ${link.getAttribute('href')}`);
        console.log(`Link text: ${link.textContent}`);
      });
    });
  }, 100);

  const textLabel = new CSS2DObject(textDiv);
  const wallId = wall.userData.wallId;
  const positions = {
    front: { x: 0, y: 0, z: 0.1, rotY: 0 },
    back: { x: 0, y: 0, z: -0.1, rotY: 0 },
    left: { x: 0.1, y: 0, z: 0, rotY: Math.PI / 2 },
    right: { x: -0.1, y: 0, z: 0, rotY: -Math.PI / 2 }
  };
  
  const pos = positions[wallId];
  textLabel.position.set(pos.x, pos.y, pos.z);
  if (pos.rotY) textLabel.rotation.y = pos.rotY;
  
  wall.add(textLabel);
  return textLabel;
}

const imagePlaneWidth = 8;
const imagePlaneHeight = 8;

function createImagePlane() {
  const imagePath = '/photos/MSimages/MS5.webp';
  const placeholderMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x00AAFF,
    side: THREE.DoubleSide,
  });

  const planeGeometry = new THREE.PlaneGeometry(imagePlaneWidth, imagePlaneHeight);
  const rightImagePlane = new THREE.Mesh(planeGeometry, placeholderMaterial);

  rightImagePlane.position.set(roomSize / 2 - 0.8, roomHeight / 2 - 4, 0);
  rightImagePlane.rotation.y = -Math.PI / 2;
  rightImagePlane.scale.set(1, 1, 1);

  scene.add(rightImagePlane);

  textureLoader.load(
    imagePath,
    (texture) => {
      rightImagePlane.material = new THREE.MeshBasicMaterial({ 
        map: texture,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      });
      console.log(`Right wall image loaded from ${imagePath}`);
    },
    undefined,
    (error) => {
      console.warn(`Failed to load image from ${imagePath}:`, error);
    }
  );

  return rightImagePlane;
}

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

function loadGLBModels() {
  const modelPaths = [
    '/models/MSmodels/MS5.glb',
    '/models/MSmodels/MS5_3.glb',
    '/models/MSmodels/MS5_4.glb'
  ];
  
  const positions = [
    { x: -6, y: 4, z: 0 },  
    { x: -9, y: 2, z: -7.5 },   
    { x: -8, y: 3, z: 5 } 
  ];
  
  const scales = [
    { x: 4, y: 4, z: 4 }, 
    { x: 30, y: 30, z: 30 },   
    { x: 6, y: 6, z: 6 }  
  ];

  const rotations = [
    { x: 0, y: 6.5, z: 5 },    
    { x: Math.PI / 4, y: 0, z: 0 },  
    { x: 0, y: 0, z: 3 }   
  ];
  
  modelPaths.forEach((path, index) => {
    loader.load(
      path,
      (gltf) => {
        const model = gltf.scene;
        model.position.set(
          positions[index].x,
          positions[index].y,
          positions[index].z
        );
        
        model.scale.set(
          scales[index].x,
          scales[index].y,
          scales[index].z
        );

        model.rotation.set(
          rotations[index].x,
          rotations[index].y,
          rotations[index].z
        );
        
        tremblingModels.push(model);
        scene.add(model);
        console.log(`Model loaded from ${path} with DRACO support`);
        
        if (index === 0) {
          console.log(`MS5.glb positioned at: x=${model.position.x}, y=${model.position.y}, z=${model.position.z}`);
          console.log(`Wall position: x=${-roomSize / 2}, thickness=${wallThickness}`);
        }
      },
      (xhr) => {
        console.log(`${path}: ${(xhr.loaded / xhr.total * 100)}% loaded`);
      },
      (error) => {
        console.error(`Error loading model ${path}:`, error);
      }
    );
  });
}

room = createRoom();
scene.add(room.group);
attemptTextureLoading();

const wallTexts = [
  {
    wall: 'back',
    content: `<p>the space is filled with the sound of electrified strings stroked
    something is changing twitch▆ corners of a bleached smile tightly 
    collapsed manicu▆ hands an unblinking glassy ga▆ feet shifting in place
    there is that girl that was so cordial but now she stands a little too clo▆
    I ask for her n▆▆ again and she says it's ▆▆▆▆ she makes small talk with 
    me but then I cat▆ him in the corner of my eye he beckons me from the doorway 
    down a long hallway ▆▆ from everyone I go to him and he sh▆ the door quietly</p>`
  },
  {
    wall: 'back',
    content: `<p>.. / .-. . -.-. .- .-.. .-.. / -.-. . .-. - .- .. -. / -- --- -- . -. - ... 
    --..-- / .-.. . - / ..- ... / -.-. .- .-.. .-.. / - .... . -- / .. -.-. . -... 
    . .-. --. ... / .. -. / .--. .- .-. .- -.. .. ... . --..-- / .-- .... . -. / .- 
    ..-. - . .-. / .... .- ...- .. -. --. / .... .- -.. / -- -.-- / ..-. .. .-.. .-.
    . / --- ..-. / .... . .-.</p>`
  },
  {
    wall: 'right',
    content: `<p>YOU WERE SLEEPING WITH A STRANGER ▆▆▆▆▆ERE SLEEPING WITH A STRANGER</p>`
  },
  {
    wall: 'right',
    content: `<p>-.-- --- ..- / .-- . .-. . /-.-- --- ..- / .-- . .-. . /</p>`
  },
  {
    wall: 'right',
    content: `<p>-.-- --- ..- / .-- . .-. . /-.-- --- ..- / .-- . .-. . /</p>
    <p>-.-- --- ..- / .-- . .-. . /-.-- --- ..- / .-- . .-. . / YOU WERE SLEEPING WITH A STRANGER</p>
    <p>YOU WERE SLEEPING ▆▆ A STRANGER</p>
    <p>YOU WERE SLEEPING WITH A STRANGER</p>`
  },
  {
    wall: 'left',
    content: `<p>▆▆▆,</p>
    <p>I know what this loo▆ like. You don't understand yet. But you will. I haven't gone insane
    and I'm certainly not trying to rewrite the ▆▆. I'm writing the future, ▆▆ fut▆e. Don't tell
    me any of that nonse▆▆. It's impossi▆ for me to f▆get you or what we share with each other.
    That guilt you've been shouldering is something I know has caused you nothi▆ but pain and I
    wish to take it away. But I have to ask that you just wa▆ a little bit l▆ger for me. Getting
    close to her has go▆en ▆ in. From here, I can do what I nev▆ could have done when I was nobody
    to ▆▆. Soon, you'll see <a href="MS6.html">what I mean</a>. For now, revert all your a▆ect▆ns back to ▆▆.
    Play your part with ▆▆, just like I am with h▆.</p>
    <p>We will reunite, I promi▆. You know I never ▆ back on my word.</p>
    <p>I love you.</p>
    <p>P▆▆</p>`
  }
];

wallTexts.forEach(({ wall, content }) => {
  addTextToWall(room.walls[wall], content);
});

createImagePlane();
loadGLBModels();

let isAltPressed = false;
let isRotating = false;
let previousMouseX = 0;
const rotationSpeed = 0.01;

const keyHandlers = {
  keydown: (event) => {
    if (event.key === 'Alt') isAltPressed = true;
  },
  keyup: (event) => {
    if (event.key === 'Alt') {
      isAltPressed = false;
      isRotating = false;
    }
  }
};

const mouseHandlers = {
  mousedown: (event) => {
    if (isAltPressed) {
      isRotating = true;
      previousMouseX = event.clientX;
    }
  },
  mouseup: () => isRotating = false,
  mousemove: (event) => {
    if (isRotating && isAltPressed) {
      const deltaX = event.clientX - previousMouseX;
      camera.rotation.y += deltaX * rotationSpeed;
      previousMouseX = event.clientX;
    }
  }
};

Object.entries(keyHandlers).forEach(([event, handler]) => {
  document.addEventListener(event, handler);
});

Object.entries(mouseHandlers).forEach(([event, handler]) => {
  document.addEventListener(event, handler);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  
  tremblingModels.forEach((model) => {
    model.rotation.x += (Math.random() - 0.5) * 0.003;
    model.rotation.y += (Math.random() - 0.5) * 0.003;
    model.position.x += (Math.random() - 0.5) * 0.005;
    model.position.y += (Math.random() - 0.5) * 0.005;
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