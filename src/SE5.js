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

document.body.appendChild(sceneOverlay);

const assetLoader = {
    promises: [],
    
    addPromise(promise) {
        const wrappedPromise = promise
            .catch(error => {
                console.warn("Asset loading error:", error);
                return null;
            });
            
        this.promises.push(wrappedPromise);
        return wrappedPromise;
    },
    
    allLoaded() {
        return Promise.all(this.promises);
    }
};

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

const audioPaths = [
  '/sound/SE5.mp3',
];

function loadAudio() {
    return new Promise((resolve, reject) => {
        function tryNextPath(index) {
            if (index >= audioPaths.length) {
                console.warn('Failed to load audio after trying all paths');
                reject(new Error('Failed to load audio'));
                return;
            }
            
            const path = audioPaths[index];
            console.log(`Attempting to load audio from: ${path}`);
            
            audioLoader.load(
                path,
                (buffer) => {
                    sound.setBuffer(buffer);
                    sound.setLoop(true);
                    sound.setVolume(0.2);
                    console.log(`Audio loaded successfully from ${path}`);
                    resolve(buffer);
                },
                (xhr) => {
                    console.log(`Loading audio ${path}: ${(xhr.loaded / xhr.total * 100)}%`);
                },
                (error) => {
                    console.warn(`Failed to load audio from ${path}:`, error);
                    tryNextPath(index + 1);
                }
            );
        }
        
        tryNextPath(0);
    });
}

assetLoader.addPromise(loadAudio());

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
        texture.repeat.set(1, 1);
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
  '/photos/SEimages/SEtexture.png',
];

function loadRoomTextures() {
    return new Promise(async (resolve) => {
        for (const path of texturePaths) {
            try {
                const texture = await loadTexture(path);
                roomMaterial = new THREE.MeshStandardMaterial({ 
                    map: texture,
                    roughness: 0.7,
                    metalness: 0.2,
                });
                console.log(`Successfully loaded texture from path: ${path}`);
                resolve(texture);
                return;
            } catch (error) {
                console.warn(`Failed to load texture from path: ${path}`);
            }
        }
        resolve(null);
    });
}

assetLoader.addPromise(loadRoomTextures());

let room;
let imagePlane;
const imagePlaneWidth = 15;
const imagePlaneHeight = 10;

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
  
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.03);
  roomGroup.add(ambientLight);
  
  const mainLight = new THREE.DirectionalLight(0xffffff, 0.03);
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

function loadImageTexture() {
    return new Promise((resolve) => {
        const imageTexturePaths = [
            '/photos/SEimages/SE8.png',
        ];
        
        function tryLoadingWithNextPath(index) {
            if (index >= imageTexturePaths.length) {
                console.warn('Failed to load image after trying all paths');
                resolve(null);
                return;
            }
            
            const path = imageTexturePaths[index];
            console.log(`Attempting to load image from: ${path}`);
            
            textureLoader.load(
                path,
                (texture) => {
                    console.log(`Image texture loaded successfully from ${path}`);
                    resolve(texture);
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
    });
}

const imageTexturePromise = assetLoader.addPromise(loadImageTexture());

function createImagePlane(texture) {
    const planeGeometry = new THREE.PlaneGeometry(imagePlaneWidth, imagePlaneHeight);
    
    const material = texture ? 
        new THREE.MeshBasicMaterial({ 
            map: texture,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        }) : 
        new THREE.MeshBasicMaterial({ 
            color: 0xFF5500,
            side: THREE.DoubleSide
        });
    
    imagePlane = new THREE.Mesh(planeGeometry, material);
    imagePlane.position.set(0, roomHeight / 3, roomSize / 2 - 0.6);
    imagePlane.rotation.y = Math.PI; 
    scene.add(imagePlane);
    
    return imagePlane;
}

function loadRightWallImage() {
    return new Promise((resolve) => {
        const imageTexturePaths = [
            '/photos/endbutton.png'
        ];
        
        function tryLoadingWithNextPath(index) {
            if (index >= imageTexturePaths.length) {
                console.warn('Failed to load right wall image after trying all paths');
                resolve(null);
                return;
            }
            
            const path = imageTexturePaths[index];
            console.log(`Trying to load right wall image from: ${path}`);
            
            textureLoader.load(
                path,
                (texture) => {
                    console.log(`Right wall image loaded from ${path}`);
                    resolve(texture);
                },
                undefined,
                (error) => {
                    console.warn(`Failed from ${path}`, error);
                    tryLoadingWithNextPath(index + 1);
                }
            );
        }
        
        tryLoadingWithNextPath(0);
    });
}

const rightWallImagePromise = assetLoader.addPromise(loadRightWallImage());

function createRightWallImagePlane(texture) {
    const planeGeometry = new THREE.PlaneGeometry(13, 13);
    
    const material = texture ? 
        new THREE.MeshBasicMaterial({ 
            map: texture,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        }) : 
        new THREE.MeshBasicMaterial({ 
            color: 0x00FFFF,
            side: THREE.DoubleSide
        });
    
    const rightWallImagePlane = new THREE.Mesh(planeGeometry, material);
    rightWallImagePlane.position.set(roomSize / 2 - wallThickness / 2 - 0.01, roomHeight / 2.5, -3);
    rightWallImagePlane.rotation.y = -Math.PI / 2;
    scene.add(rightWallImagePlane);
    
    return rightWallImagePlane;
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
      link.style.color = '#00008B';
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

async function initScene() {
    try {
        await assetLoader.allLoaded();
        
        room = createRoom();
        scene.add(room.group);
        
        const imageTexture = await imageTexturePromise;
        createImagePlane(imageTexture);
        
        const rightWallTexture = await rightWallImagePromise;
        createRightWallImagePlane(rightWallTexture);
        
        addTextToWall(room.walls.left, `
          <p>There's this notion that revenge is never worth it. I tend to agree, 
          but only if you've been wronged in a rather mild manner. And clearly I 
          haven't been. I need to go beyond revenge. Revenge is a blow whose pain 
          eventually fades. I want justice. And in these wild times, justice has 
          the taste of spilled <a href="MS1.html">blood</a>.</p>
        `);
        
        addTextToWall(room.walls.right, `
          <p><a href="SEending.html">WAKE UP</a>
          ꟼU ƎꓘAW ꟼU</p>
        `);
        
        addTextToWall(room.walls.right, `
          <p>- .... . -. / - .... . / -.. ..- ... - / 
          .-- .. .-.. .-.. / .-. . - ..- .-. -.</p>
        `);

           addTextToWall(room.walls.front, `
          <p>the reeds whispered bittersweet songs</p>
          <p>and secrets that would become too hard to keep</p>
          <p>too hard to keep</P>
          <p>hard to keep</P>
          <p>to keep</P>
        `);

         addTextToWall(room.walls.front, `
          <p></p>
          <p></p>
          <p>/P>
          <p>.-.   . - .-. . - </P>
          <p>.-. .   - </P>
        `);
        
        animate();
        
        if (sound.buffer) {
            sound.play();
        }
        
        setTimeout(() => {
            sceneOverlay.style.opacity = '0';
            setTimeout(() => {
                sceneOverlay.style.display = 'none';
            }, 5000);
        }, 5000);
        
    } catch (error) {
        console.error("Error initializing scene:", error);
        sceneOverlay.style.display = 'none';
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScene);
} else {
    initScene();
}