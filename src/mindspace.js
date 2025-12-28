import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

let scene, camera, renderer, controls;
let raycaster, mouse;
let clickableObjects = [];


let redTendrilLines = [];
let blueTendrilLines = [];
let hoverStates = {
    red: {
        active: false,
        lastHoverEnd: 0
    },
    blue: {
        active: false,
        lastHoverEnd: 0
    }
};

function init() {
 
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

 
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(renderer.domElement);


    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0x110d55, 1.2);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);


    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    createObjects();


    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onClick);


    animate();
}

function createObjects() {

    loadRedDoor();
    
    
    loadBlueDoor();
}

function loadRedDoor() {
    const textureLoader = new THREE.TextureLoader();
    const objLoader = new OBJLoader();
    

    textureLoader.load(
        '/models/reddoor.webp',
        function(texture) {
          
            objLoader.load(
                '/models/reddoor.obj',
                function(object) {
              
                    object.traverse(function(child) {
                        if (child instanceof THREE.Mesh) {
                            const newMaterial = new THREE.MeshStandardMaterial({
                                map: texture,
                                metalness: 0.3,
                                roughness: 0.7,
                                emissive: 0x331111,
                                emissiveIntensity: 0.2
                            });
                            child.material = newMaterial;
                        }
                    });
                    
              
                    const boundingBox = new THREE.Box3().setFromObject(object);
                    const objHeight = boundingBox.max.y - boundingBox.min.y;
                    const centerY = -(boundingBox.min.y + objHeight/2);
                    
                  
                    object.position.set(-2.5, centerY, 0);
                    object.scale.set(1, 1, 1);
                    object.userData = { 
                        clickable: true,
                        targetPage: "/pages/MS1.html",
                        originalPosition: new THREE.Vector3(-2.5, centerY, 0),
                        hoverEffect: {
                            active: false,
                            intensity: 0.05,
                            phase: 0
                        },
                        doorType: "red"
                    };
                    
                    scene.add(object);
                    clickableObjects.push(object);
                    console.log('Red door loaded successfully');
                },
                function(progress) {
                    console.log('Loading red door OBJ:', progress);
                },
                function(error) {
                    console.error('Error loading red door OBJ:', error);
                }
            );
        },
        function(progress) {
            console.log('Loading red door texture:', progress);
        },
        function(error) {
            console.warn('Red door texture failed, loading OBJ without texture:', error);
       
            objLoader.load(
                '/models/reddoor.obj',
                function(object) {
              
                    object.traverse(function(child) {
                        if (child instanceof THREE.Mesh) {
                            const newMaterial = new THREE.MeshStandardMaterial({
                                color: 0xcc3333,
                                metalness: 0.3,
                                roughness: 0.7,
                                emissive: 0x331111,
                                emissiveIntensity: 0.2
                            });
                            child.material = newMaterial;
                        }
                    });
                    
                    const boundingBox = new THREE.Box3().setFromObject(object);
                    const objHeight = boundingBox.max.y - boundingBox.min.y;
                    const centerY = -(boundingBox.min.y + objHeight/2);
                    
                    object.position.set(-2.5, centerY, 0);
                    object.userData = { 
                        clickable: true,
                        targetPage: "/pages/MS1.html",
                        originalPosition: new THREE.Vector3(-2.5, centerY, 0),
                        hoverEffect: {
                            active: false,
                            intensity: 0.05,
                            phase: 0
                        },
                        doorType: "red"
                    };
                    scene.add(object);
                    clickableObjects.push(object);
                    console.log('Red door loaded without texture');
                },
                undefined,
                function(error) {
                    console.error('Failed to load red door OBJ:', error);
                }
            );
        }
    );
}

function loadBlueDoor() {
    const textureLoader = new THREE.TextureLoader();
    const objLoader = new OBJLoader();
    
 
    textureLoader.load(
        '/models/bluedoor.webp',
        function(texture) {

            objLoader.load(
                '/models/bluedoor.obj',
                function(object) {
  
                    object.traverse(function(child) {
                        if (child instanceof THREE.Mesh) {
                            const newMaterial = new THREE.MeshStandardMaterial({
                                map: texture,
                                metalness: 0.3,
                                roughness: 0.7,
                                emissive: 0x222222,
                                emissiveIntensity: 0.2
                            });
                            child.material = newMaterial;
                        }
                    });
                    
    
                    const boundingBox = new THREE.Box3().setFromObject(object);
                    const objHeight = boundingBox.max.y - boundingBox.min.y;
                    const centerY = -(boundingBox.min.y + objHeight/2);
                    
                 
                    object.position.set(2.5, centerY, 0);
                    object.scale.set(1, 1, 1);
                    object.userData = { 
                        clickable: true,
                        targetPage: "/pages/SE1.html",
                        originalPosition: new THREE.Vector3(2.5, centerY, 0),
                        hoverEffect: {
                            active: false,
                            intensity: 0.08,
                            phase: Math.PI / 2
                        },
                        doorType: "blue"
                    };
                    
                    scene.add(object);
                    clickableObjects.push(object);
                    console.log('Blue door loaded successfully');
                },
                function(progress) {
                    console.log('Loading blue door OBJ:', progress);
                },
                function(error) {
                    console.error('Error loading blue door OBJ:', error);
                }
            );
        },
        function(progress) {
            console.log('Loading blue door texture:', progress);
        },
        function(error) {
            console.warn('Blue door texture failed, loading OBJ without texture:', error);
   
            objLoader.load(
                '/models/bluedoor.obj',
                function(object) {
                 
                    object.traverse(function(child) {
                        if (child instanceof THREE.Mesh) {
                            const newMaterial = new THREE.MeshStandardMaterial({
                                color: 0x0000cc,
                                metalness: 0.3,
                                roughness: 0.7,
                                emissive: 0x000033,
                                emissiveIntensity: 0.2
                            });
                            child.material = newMaterial;
                        }
                    });
                    
                    const boundingBox = new THREE.Box3().setFromObject(object);
                    const objHeight = boundingBox.max.y - boundingBox.min.y;
                    const centerY = -(boundingBox.min.y + objHeight/2);
                    
                    object.position.set(2.5, centerY, 0);
                    object.userData = { 
                        clickable: true,
                        targetPage: "/pages/SE1.html",
                        originalPosition: new THREE.Vector3(2.5, centerY, 0),
                        hoverEffect: {
                            active: false,
                            intensity: 0.08,
                            phase: Math.PI / 2
                        },
                        doorType: "blue"
                    };
                    scene.add(object);
                    clickableObjects.push(object);
                    console.log('Blue door loaded without texture');
                },
                undefined,
                function(error) {
                    console.error('Failed to load blue door OBJ:', error);
                }
            );
        }
    );
}


function createTendril(doorType, startPosition) {
  
    const points = [];
    points.push(new THREE.Vector3(startPosition.x, startPosition.y, startPosition.z));
    

    const randomOffset = 0.3;
    const point2 = new THREE.Vector3(
        startPosition.x + (Math.random() * randomOffset * 2 - randomOffset),
        startPosition.y + (Math.random() * randomOffset * 2 - randomOffset),
        startPosition.z + (Math.random() * randomOffset * 2 - randomOffset)
    );
    points.push(point2);
    

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    

    const material = new THREE.LineBasicMaterial({ 
        color: doorType === "red" ? 0x8B0000 : 0x110d55,
        transparent: true,
        opacity: 0.7
    });
    
 
    const line = new THREE.Line(geometry, material);
    scene.add(line);
    

    const tendril = {
        points: points,
        line: line,
        doorType: doorType,
        age: 0,
        maxAge: Math.random() * 100 + 100,
        growRate: Math.random() * 0.3 + 0.1 
    };
    

    if (doorType === "red") {
        redTendrilLines.push(tendril);
    } else {
        blueTendrilLines.push(tendril);
    }
    
    return tendril;
}

function generateTendrils(doorType, position) {

    const count = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < count; i++) {

        const startPos = new THREE.Vector3(
            position.x + (Math.random() * 0.6 - 0.3),
            position.y + (Math.random() * 0.6 - 0.3),
            position.z
        );
        
 
        createTendril(doorType, startPos);
    }
}


function updateTendrils() {
 
    for (let i = redTendrilLines.length - 1; i >= 0; i--) {
        const tendril = redTendrilLines[i];
        

        tendril.age++;
        
    
        if (tendril.age > tendril.maxAge) {
        
            tendril.line.material.opacity -= 0.05;
            if (tendril.line.material.opacity <= 0) {
                scene.remove(tendril.line);
                redTendrilLines.splice(i, 1);
            }
            continue;
        }
        
  
        if (Math.random() < tendril.growRate) {
     
            const lastPoint = tendril.points[tendril.points.length - 1];
            
         
            const angle = Math.random() * Math.PI * 2;
            const stepSize = Math.random() * 0.2 + 0.05;
            
         
            const newPoint = new THREE.Vector3(
                lastPoint.x + Math.cos(angle) * stepSize,
                lastPoint.y + Math.sin(angle) * stepSize,
                lastPoint.z + (Math.random() * 0.1 - 0.05)
            );
            
       
            tendril.points.push(newPoint);
            
        
            const updatedGeometry = new THREE.BufferGeometry().setFromPoints(tendril.points);
            tendril.line.geometry.dispose(); 
            tendril.line.geometry = updatedGeometry;
        }
        
 
        if (tendril.points.length > 3 && tendril.points.length < 20 && Math.random() < 0.03) {

            const branchIndex = Math.floor(Math.random() * (tendril.points.length - 2)) + 1;
            const branchPoint = tendril.points[branchIndex];
            

            createTendril("red", branchPoint.clone());
        }
    }
    

    for (let i = blueTendrilLines.length - 1; i >= 0; i--) {
        const tendril = blueTendrilLines[i];
        
 
        tendril.age++;
        
   
        if (tendril.age > tendril.maxAge) {
 
            tendril.line.material.opacity -= 0.05;
            if (tendril.line.material.opacity <= 0) {
                scene.remove(tendril.line);
                blueTendrilLines.splice(i, 1);
            }
            continue;
        }
        

        if (Math.random() < tendril.growRate) {
       
            const lastPoint = tendril.points[tendril.points.length - 1];
            
        
            const angle = Math.random() * Math.PI * 2;
            const stepSize = Math.random() * 0.2 + 0.05;
            
    
            const newPoint = new THREE.Vector3(
                lastPoint.x + Math.cos(angle) * stepSize,
                lastPoint.y + Math.sin(angle) * stepSize,
                lastPoint.z + (Math.random() * 0.1 - 0.05)
            );
            
     
            tendril.points.push(newPoint);
            
  
            const updatedGeometry = new THREE.BufferGeometry().setFromPoints(tendril.points);
            tendril.line.geometry.dispose(); 
            tendril.line.geometry = updatedGeometry;
        }
        
     
        if (tendril.points.length > 3 && tendril.points.length < 20 && Math.random() < 0.03) {
      
            const branchIndex = Math.floor(Math.random() * (tendril.points.length - 2)) + 1;
            const branchPoint = tendril.points[branchIndex];
    
            createTendril("blue", branchPoint.clone());
        }
    }
 
    if (redTendrilLines.length > 50) {
        const toRemove = redTendrilLines.length - 50;
        for (let i = 0; i < toRemove; i++) {
            const oldTendril = redTendrilLines.shift();
            scene.remove(oldTendril.line);
        }
    }
    
  
    if (blueTendrilLines.length > 50) {
        const toRemove = blueTendrilLines.length - 50;
        for (let i = 0; i < toRemove; i++) {
            const oldTendril = blueTendrilLines.shift();
            scene.remove(oldTendril.line);
        }
    }
}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}


function onMouseMove(event) {

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    

    raycaster.setFromCamera(mouse, camera);
    
  
    const intersects = raycaster.intersectObjects(clickableObjects, true);
    
   
    let redHovered = false;
    let blueHovered = false;
    
    
    document.body.style.cursor = 'default';
    
 
    clickableObjects.forEach(obj => {
        obj.userData.hoverEffect.active = false;
    });
    

    if (intersects.length > 0) {
        const rootObject = getRootObject(intersects[0].object);
        if (rootObject && rootObject.userData && rootObject.userData.clickable) {
        
            document.body.style.cursor = 'pointer';
            
            
            rootObject.userData.hoverEffect.active = true;
            
        
            if (rootObject.userData.doorType === "red") {
                redHovered = true;
             
                if (Math.random() < 0.1) { 
                    generateTendrils("red", rootObject.position);
                }
            } else if (rootObject.userData.doorType === "blue") {
                blueHovered = true;
         
                if (Math.random() < 0.1) { 
                    generateTendrils("blue", rootObject.position);
                }
            }
        }
    }
    
 
    if (redHovered) {
        if (!hoverStates.red.active) {
            
            hoverStates.red.active = true;
           
            const redDoor = clickableObjects.find(obj => obj.userData.doorType === "red");
            if (redDoor) {
                generateTendrils("red", redDoor.position);
            }
        }
    } else {
        if (hoverStates.red.active) {
           
            hoverStates.red.active = false;
            hoverStates.red.lastHoverEnd = performance.now();
        }
    }
    

    if (blueHovered) {
        if (!hoverStates.blue.active) {
            
            hoverStates.blue.active = true;
     
            const blueDoor = clickableObjects.find(obj => obj.userData.doorType === "blue");
            if (blueDoor) {
                generateTendrils("blue", blueDoor.position);
            }
        }
    } else {
        if (hoverStates.blue.active) {
           
            hoverStates.blue.active = false;
            hoverStates.blue.lastHoverEnd = performance.now();
        }
    }
}

function getRootObject(object) {
    let current = object;
    while (current) {
        if (current.userData && current.userData.clickable) {
            return current;
        }
        if (!current.parent || current.parent === scene) {
            return null;
        }
        current = current.parent;
    }
    return null;
}

function onClick(event) {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickableObjects, true);
    
    if (intersects.length > 0) {
        const rootObject = getRootObject(intersects[0].object);
        
        if (rootObject && rootObject.userData.clickable && rootObject.userData.targetPage) {
            const overlay = document.createElement('div');
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100vw';
            overlay.style.height = '100vh';
            overlay.style.backgroundColor = 'black';
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 1s ease';
            overlay.style.zIndex = '1000';
            document.body.appendChild(overlay);
            
            setTimeout(() => {
                overlay.style.opacity = '1';
                
                setTimeout(() => {
                    window.location.href = rootObject.userData.targetPage;
                }, 1000);
            }, 50);
        }
    }
}


function animate() {
    requestAnimationFrame(animate);


    const time = performance.now() * 0.001; 
    
    clickableObjects.forEach(object => {
        if (object.userData.hoverEffect.active) {
        
            const originalPos = object.userData.originalPosition;
            const intensity = object.userData.hoverEffect.intensity;
            const phase = object.userData.hoverEffect.phase;
            
        
            object.position.x = originalPos.x + Math.sin(time * 15 + phase) * intensity;
            object.position.y = originalPos.y + Math.sin(time * 20) * intensity;
            object.position.z = originalPos.z + Math.sin(time * 12 - phase) * intensity;
            
            object.rotation.x = Math.sin(time * 10) * 0.05;
            object.rotation.y = Math.sin(time * 8) * 0.05;
        } else {

            const originalPos = object.userData.originalPosition;
            object.position.lerp(originalPos, 0.1);
            object.rotation.x *= 0.9;
            object.rotation.y *= 0.9;
        }
    });
    

    clickableObjects.forEach((obj, index) => {
        obj.rotation.y += 0.005 * (index + 1);
        obj.rotation.x += 0.002 * (index + 1);
    });
    

    updateTendrils();
    
    
    renderer.render(scene, camera);
}

window.addEventListener('load', async () => {
 
    init();
    

    const audio = new Audio('/sound/mindspacemusic.mp3');
    audio.loop = true;
    audio.volume = 0.5;
    

    try {
        await audio.play();
        console.log('Audio started automatically');
    } catch (error) {
        console.log('Autoplay prevented, waiting for user interaction');

        document.addEventListener('click', () => {
            audio.play();
        }, { once: true });
    }
});