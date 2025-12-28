import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

const sceneOverlay = document.createElement('div');
sceneOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#000;z-index:9999;transition:opacity 1.5s ease-out';
document.body.appendChild(sceneOverlay);

const assetLoader = {
    promises: [],
    addPromise(promise) {
        const wrappedPromise = promise.catch(error => {
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

const audioListener = new THREE.AudioListener();
camera.add(audioListener);
const sound = new THREE.Audio(audioListener);

function loadAudio() {
    return new Promise((resolve, reject) => {
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load('/sound/MS6.mp3', 
            buffer => {
                sound.setBuffer(buffer);
                sound.setLoop(true);
                sound.setVolume(0.5);
                console.log('Audio loaded');
                resolve(buffer);
            },
            xhr => console.log(`Audio loading: ${(xhr.loaded / xhr.total) * 100}% loaded`),
            error => {
                console.error('Error loading audio:', error);
                reject(error);
            }
        );
    });
}

assetLoader.addPromise(loadAudio());

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.cssText = 'position:absolute;top:0;pointer-events:none';
document.body.appendChild(labelRenderer.domElement);

camera.position.set(0, 5, 0);
camera.lookAt(-10, 5, 0);

const roomSize = 20, roomHeight = 18, wallThickness = 0.5;
const textureLoader = new THREE.TextureLoader();
const defaultMaterial = new THREE.MeshStandardMaterial({ color: 0x00008B, roughness: 0.7, metalness: 0.2 });
let roomMaterial = defaultMaterial, room;

function loadTexture(path) {
    return new Promise((resolve, reject) => {
        textureLoader.load(
            path,
            texture => {
                console.log(`Texture loaded successfully: ${path}`);
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(1, 1);
                resolve(texture);
            },
            xhr => console.log(`Texture ${path} loading: ${(xhr.loaded / xhr.total) * 100}%`),
            error => {
                console.error(`Error loading texture ${path}:`, error);
                reject(error);
            }
        );
    });
}

function loadRoomTextures() {
    return new Promise(async resolve => {
        try {
            const texture = await loadTexture('/photos/MSimages/MStexture.png');
            roomMaterial = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.7, metalness: 0.2 });
            console.log('Successfully loaded texture');
            updateRoomMaterials();
            resolve(texture);
        } catch (error) {
            console.warn('Failed to load texture');
            resolve(null);
        }
    });
}

assetLoader.addPromise(loadRoomTextures());

function loadModel(path, scale, position, rotation = { x: 0, y: 0, z: 0 }) {
    return new Promise((resolve, reject) => {
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/');
        
        const loader = new GLTFLoader();
        loader.setDRACOLoader(dracoLoader);
        
        loader.load(
            path,
            gltf => {
                const model = gltf.scene;
                model.scale.set(scale.x, scale.y, scale.z);
                model.position.set(position.x, position.y, position.z);
                model.rotation.set(rotation.x, rotation.y, rotation.z);
                
                model.traverse(child => {
                    if (child.isMesh) {
                        child.castShadow = child.receiveShadow = true;
                    }
                });
                
                scene.add(model);
                resolve(model);
            },
            xhr => console.log(`${path} loading: ${(xhr.loaded / xhr.total) * 100}%`),
            error => {
                console.error(`Error loading ${path}:`, error);
                reject(error);
            }
        );
    });
}

assetLoader.addPromise(loadModel('/models/MSmodels/MS6.glb', {x: 5, y: 5, z: 5}, {x: 0, y: 0.20, z: -10}));

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
    wall1.receiveShadow = wall1.castShadow = true;
    wall1.userData = { wallId: 'front' };
    roomGroup.add(wall1);
    
    const wall2 = wall1.clone();
    wall2.position.z = roomSize / 2;
    wall2.userData = { wallId: 'back' };
    roomGroup.add(wall2);
    
    const wall3Geometry = new THREE.BoxGeometry(wallThickness, roomHeight, roomSize);
    const wall3 = new THREE.Mesh(wall3Geometry, roomMaterial);
    wall3.position.set(-roomSize / 2, roomHeight / 2, 0);
    wall3.receiveShadow = wall3.castShadow = true;
    wall3.userData = { wallId: 'left' };
    roomGroup.add(wall3);
    
    const wall4 = wall3.clone();
    wall4.position.x = roomSize / 2;
    wall4.userData = { wallId: 'right' };
    roomGroup.add(wall4);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
    roomGroup.add(ambientLight);
    
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.05);
    mainLight.position.set(0, 15, 0);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = mainLight.shadow.mapSize.height = 2048;
    roomGroup.add(mainLight);
    
    return {
        group: roomGroup,
        walls: { front: wall1, back: wall2, left: wall3, right: wall4 }
    };
}

function updateRoomMaterials() {
    if (!room) return;
    room.group.children.forEach(child => {
        if (child.isMesh) child.material = roomMaterial;
    });
    renderer.render(scene, camera);
}

function addImageToBackWall() {
    return new Promise((resolve, reject) => {
        textureLoader.load(
            '/photos/endbutton.png',
            texture => {
                const geometry = new THREE.PlaneGeometry(10, 10);
                const material = new THREE.MeshBasicMaterial({ 
                    map: texture, transparent: true, opacity: 0.5, side: THREE.DoubleSide 
                });
                const imagePlane = new THREE.Mesh(geometry, material);
                imagePlane.position.set(0, roomHeight / 2 - 4, roomSize / 2 - 0.5);
                imagePlane.rotation.y = Math.PI;
                scene.add(imagePlane);
                resolve(imagePlane);
            },
            undefined,
            error => {
                console.error('Error loading back wall image:', error);
                reject(error);
            }
        );
    });
}

assetLoader.addPromise(addImageToBackWall());

function addTextToWall(wall, textContent) {
    const textDiv = document.createElement('div');
    textDiv.className = 'wall-text';
    textDiv.style.cssText = 'width:1000px;padding:20px;color:white;border-radius:10px;font-family:Arial,sans-serif;font-size:25px;pointer-events:auto';
    textDiv.innerHTML = textContent;
    
    setTimeout(() => {
        const links = textDiv.querySelectorAll('a');
        links.forEach(link => {
            link.style.cssText = 'color:#0808fc;text-decoration:none;cursor:pointer';
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
            textLabel.position.set(0, 0, 0.1);
            break;
        case 'back':
            textLabel.position.set(-7, -2, -0.1);
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

function addImageToLeftWall() {
    return new Promise((resolve, reject) => {
        textureLoader.load(
            '/photos/MSimages/MS6.webp',
            texture => {
                const geometry = new THREE.PlaneGeometry(15, 10);
                const material = new THREE.MeshBasicMaterial({
                    map: texture, transparent: true, opacity: 0.5, side: THREE.DoubleSide
                });
                const imagePlane = new THREE.Mesh(geometry, material);
                imagePlane.position.set(-roomSize / 2 + 0.8, roomHeight / 2 - 3, 0);
                imagePlane.rotation.y = Math.PI / 2;
                scene.add(imagePlane);
                resolve(imagePlane);
            },
            undefined,
            error => {
                console.error('Error loading left wall image:', error);
                reject(error);
            }
        );
    });
}

assetLoader.addPromise(addImageToLeftWall());

let isAltPressed = false, isRotating = false, previousMouseX = 0;
const rotationSpeed = 0.01;

document.addEventListener('keydown', event => {
    if (event.key === 'Alt') isAltPressed = true;
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

document.addEventListener('mouseup', () => isRotating = false);

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

async function initScene() {
    try {
        await assetLoader.allLoaded();
        
        room = createRoom();
        scene.add(room.group);
        
        addTextToWall(room.walls.front, `
            <p>I waited till the dr▆kards had flo▆▆ out of my place, stumbling off into the
            dark streets. Their memories are f▆tered with black spots from the d▆▆ wine 
            they were so excit▆ to sip.
            </p>
        `);
        
        addTextToWall(room.walls.right, `
            <p>G▆ on the move fa▆. 
            ▆▆▆ shou▆ be done with it?
            ▆▆ light a fi▆ and ▆rn it ▆▆ dust.
            A ▆▆ of ▆drofl▆ic ac▆ can me▆ it all aw▆.
            Disapp▆r?
            I can't hi▆ what's been ▆▆.
            I don't want to.
            I'm going to sh▆ it and ▆▆▆ his wor▆ crumble to p▆ces. 
            </p>
        `);
        
        addTextToWall(room.walls.back, `<p><a href="MSending.html">WAKE UP</a></p>`);
        addTextToWall(room.walls.back, `<p>.-- .- -.- . / ..-</p>`);
        
        animate();
        
        if (sound.buffer) sound.play();
        
        setTimeout(() => {
            sceneOverlay.style.opacity = '0';
            setTimeout(() => sceneOverlay.style.display = 'none', 5000);
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