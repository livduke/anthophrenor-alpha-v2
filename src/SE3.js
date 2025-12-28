import * as THREE from 'three';
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

const listener = new THREE.AudioListener();
camera.add(listener);
const sound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();
audioLoader.load(
  '/sound/SE3.mp3',
  function(buffer) {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(0.5);
    sound.play();
    console.log('audio is playing');
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
  const audioPaths = ['/sound/SE3.mp3'];
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
let imagePlane;
const imagePlaneWidth = 5;
const imagePlaneHeight = 8;

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

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
  roomGroup.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, 0.05);
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

function createImagePlane() {
  const imageTexturePaths = ['/photos/SEimages/SE4.webp'];

  const placeholderMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xFF5500,
    side: THREE.DoubleSide
  });

  const planeGeometry = new THREE.PlaneGeometry(imagePlaneWidth, imagePlaneHeight);
  imagePlane = new THREE.Mesh(planeGeometry, placeholderMaterial);

  imagePlane.position.set(0, roomHeight / 3, roomSize / 2 - 0.6);
  imagePlane.rotation.y = Math.PI; 

  scene.add(imagePlane); 

  function tryLoadingWithNextPath(index) {
    if (index >= imageTexturePaths.length) {
      console.warn('Failed to load image after trying all paths');
      return;
    }

    const path = imageTexturePaths[index];
    console.log(`Attempting to load image from: ${path}`);

    textureLoader.load(
      path,
      (texture) => {
        imagePlane.material = new THREE.MeshBasicMaterial({ 
          map: texture,
          transparent: true,
          opacity: 0.5,
          side: THREE.DoubleSide,
        });
        console.log(`Image texture loaded successfully from ${path}`);
      },
      (xhr) => {
        console.log(`Loading ${path}: ${(xhr.loaded / xhr.total * 100)}%`);
      },
      (error) => {
        console.warn(`Failed to load image texture from ${path}:`, error);
        tryLoadingWithNextPath(index + 1);
      }
    );
  }

  tryLoadingWithNextPath(0);
}

function createImagePlane2() {
  const imagePlaneWidth2 = 12;
  const imagePlaneHeight2 = 10;
  const imagePath = '/photos/SEimages/SE3.webp';

  console.log(`Attempting to create second image plane with: ${imagePath}`);
  
  const placeholderMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x00FF00,
    side: THREE.DoubleSide
  });
  
  const planeGeometry = new THREE.PlaneGeometry(imagePlaneWidth2, imagePlaneHeight2);
  const imagePlane2 = new THREE.Mesh(planeGeometry, placeholderMaterial);
  imagePlane2.position.set(-roomSize / 2 + 0.6, roomHeight / 3, 0);
  imagePlane2.rotation.y = Math.PI / 2;
  
  scene.add(imagePlane2);

  textureLoader.load(
    imagePath,
    (texture) => {
      const material = new THREE.MeshBasicMaterial({ 
        map: texture, 
        side: THREE.DoubleSide, 
        transparent: true, 
        opacity: 0.5,
      });
      imagePlane2.material = material;
      console.log(`Second image texture loaded successfully from ${imagePath}`);
    },
    (xhr) => {
      console.log(`Loading ${imagePath}: ${(xhr.loaded / xhr.total * 100)}%`);
    },
    (error) => {
      console.error('Error loading image texture for second plane:', error);
    }
  );
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
  textDiv.style.fontSize = '25px';
  textDiv.style.pointerEvents = 'auto'; 
  textDiv.innerHTML = textContent;

  setTimeout(() => {
    const links = textDiv.querySelectorAll('a');
    links.forEach(link => {
      link.style.color = '#FF0000';
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
      textLabel.position.set(0.1, -3, 0);
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

createImagePlane();
createImagePlane2();
attemptTextureLoading();

addTextToWall(room.walls.right, `
    <p>now he's come up here with a suit looking very different his eyes and teeth 
    are clear he ain't on the chem anymore good for him I guess he puts this silver 
    compact mirror on the counter I need a custom engraving for <a href="SE5.html">my girlfriend</a> oh so 
    you're going steady with her now this is the same girl I am assuming he nods she's
    mine now he doesn't laugh he doesn't even crack a smile</p>
`);

addTextToWall(room.walls.right, `
    <p>-.. --- / -. --- - / - ..- .-. -. / - --- / -- . -.. .. ..- -- ... / --- .-. / 
    -. . -.-. .-. --- -- .- -. -.-. . .-. ... / -.. --- / -. --- - / ... . . -.- / - .... 
    . -- / --- ..- - / .- -. -.. / ... --- / -- .- -.- . / -.-- --- ..- .-. ... . .-.. ...
    - . ... / ..- -. -.-. .-.. . .- -. / -... -.-- / - .... . --</p>
`);

addTextToWall(room.walls.front,` 
  <p>he stumbles in here wearing an oversized jacket and it's got me fucking frightened 
  who knows he could be hauling some heavy metal under there he reaches his hand inside
  the jacket and I grip my neckbiter under the counter ready to fling it across the room 
  and slice him open but ████ he pulls out a wad of cash he wants some jewelry for a girl 
  for all I know he could be making that up he will probably take it to some side street 
  and resell it for twice the amount for a gr██ of spitrock I don't give a shit as long 
  as I'm making my money to my surprise he picks out the nicest charms and gems this ain't 
  cheap you've got good taste there's lots of guys who come in here and pick the tackiest 
  things he says she has impeccable taste and she only dese████ <a href="SE4.html">the best</a> he laughs and then 
  he just keeps laughing he does ██ a little too hard his cheeks begin to turn red it goes 
  on for way t██ long what██er you chemhead</p>
  `);
  
addTextToWall(room.walls.front,`
  <p>--- / .-- . .- .-- .- .--. --- -. / 
  ..-. --- .-. -- . -.. / .- --. .- .. -. ... - 
  / -- . / ... .... .- .-.. .-.. / .--. .-. --- 
  ... .--. . .-. .- -. -.. / . ...- . .-. -.-- / - --- 
  -. --. ..- . / .-- .... .. -.-. .... / .-. .. ... . ... 
  / .- --. .- .. -. ... - / -.-- --- ..- / .. -. / .--- 
  ..- -.. --. -- . -. - / -.-- --- ..- / ... .... .- .-.. 
  .-.. / -.-. --- -. -.. . -- -. - .... .. ... / .. ... / 
  - .... . / .... . .-. .. - .- --. . / --- ..-. / - .... 
  . / ... . .-. ...- .- -. - ... / --- ..-. / - .... . / 
  .-.. --- .-. -.. --..-- / .- -. -.. / - .... . .. .-. 
  / .-. .. --. .... - . --- ..- ... -. . ... ... / .. ...
   / ..-. .-. --- -- / -- .</p>
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