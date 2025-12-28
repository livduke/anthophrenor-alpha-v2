import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = null; 

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 2.5;

const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
});

const tendrilCount = 800;
const tendrils = new THREE.Group();
tendrils.position.set(0, 0, 0); 
scene.add(tendrils);

function createTendril(angle) {
    const points = [];
    let radius = 0.01;
    for (let i = 0; i < 20; i++) { 
        const x = radius * Math.cos(angle) + Math.sin(i * 0.4) * 0.1;
        const y = radius * Math.sin(angle) + Math.cos(i * 0.4) * 0.1;
        const z = (Math.random() - 0.5) * 0.3;
        
        if (isNaN(x) || isNaN(y) || isNaN(z) || !isFinite(x) || !isFinite(y) || !isFinite(z)) {
            console.warn('Invalid coordinates detected, skipping point');
            continue;
        }
        
        points.push(new THREE.Vector3(x, y, z));
        radius += 0.08; 
    }
    
    if (points.length < 2) {
        console.warn('Not enough valid points to create tendril');
        return;
    }
    
    try {
        const curve = new THREE.CatmullRomCurve3(points);
        const geometry = new THREE.TubeGeometry(curve, 32, 0.002, 8, false);
        
        if (!geometry.attributes.position || !geometry.attributes.position.array) {
            console.warn('Invalid geometry created');
            return;
        }
        
        const positionArray = geometry.attributes.position.array;
        for (let i = 0; i < positionArray.length; i++) {
            if (isNaN(positionArray[i]) || !isFinite(positionArray[i])) {
                console.warn('NaN or infinite value detected in geometry, regenerating...');
                return;
            }
        }
        
        geometry.userData.originalPositions = positionArray.slice();
        
        const material = new THREE.MeshStandardMaterial({
            color: 0x12185C,
            transparent: true,
            opacity: 1.0,
            emissive: 0x12185C,
            emissiveIntensity: 0.8,
        });
        const tendril = new THREE.Mesh(geometry, material);
        tendril.userData.waveOffset = Math.random() * Math.PI * 2;
        tendrils.add(tendril);
    } catch (error) {
        console.warn('Error creating tendril geometry:', error);
    }
}

for (let i = 0; i < tendrilCount; i++) {
    const angle = (i / tendrilCount) * Math.PI * 2;
    createTendril(angle);
}

function centerTendrilsGroup() {
    if (tendrils.children.length === 0) return;
    
    try {
        const box = new THREE.Box3().setFromObject(tendrils);
        const center = box.getCenter(new THREE.Vector3());
        
        if (isNaN(center.x) || isNaN(center.y) || isNaN(center.z)) {
            console.warn('Invalid center calculated, skipping centering');
            return;
        }
        
        tendrils.position.sub(center);
    } catch (error) {
        console.warn('Error centering tendrils:', error);
    }
}

centerTendrilsGroup();

function animateTendrils(time) {
    tendrils.children.forEach((tendril, index) => {
        const geometry = tendril.geometry;
        if (!geometry || !geometry.attributes || !geometry.attributes.position) return;
        
        const positions = geometry.attributes.position.array;
        const original = geometry.userData.originalPositions;
        const waveOffset = tendril.userData.waveOffset;

        if (!original || !positions || positions.length !== original.length) return;

        for (let i = 0; i < positions.length; i += 3) {
            if (isNaN(original[i]) || isNaN(original[i + 1]) || isNaN(original[i + 2])) continue;
            
            const wave = Math.sin(time * 0.004 + waveOffset + original[i] * 0.4) * 0.1;
            if (isNaN(wave)) continue;
            
            positions[i] = original[i];
            positions[i + 1] = original[i + 1] + wave;
            positions[i + 2] = original[i + 2]; 
        }
        geometry.attributes.position.needsUpdate = true;
    });
}

function animate(time) {
    requestAnimationFrame(animate);
    animateTendrils(time);
    tendrils.rotation.z += 0.001;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
}
animate();

function playButtonClickSound() {
    const clickSound = new Audio('/sound/menubutton.mp3');
    clickSound.volume = 0.4; 
    clickSound.play().catch(error => {
        console.warn('Could not play button sound:', error);
    });
}

const creditsButton = document.getElementById("credits-button");
const creditsSection = document.getElementById("credits-section");
const infoButton = document.getElementById("info-button");
const infoSection = document.getElementById("info-section");
const beginButton = document.getElementById("begin-button");

if (creditsButton) {
    creditsButton.addEventListener("click", () => {
        playButtonClickSound(); 
        
        if (infoSection.style.display === "block") {
            infoSection.style.display = "none";
        }
        
        if (creditsSection.style.display === "block") {
            creditsSection.style.display = "none";
        } else {
            creditsSection.style.display = "block";
        }
    });
}

if (infoButton) {
    infoButton.addEventListener("click", () => {
        playButtonClickSound(); 
        
        if (creditsSection.style.display === "block") {
            creditsSection.style.display = "none";
        }
        
        if (infoSection.style.display === "block") {
            infoSection.style.display = "none";
        } else {
            infoSection.style.display = "block";
        }
    });
}

if (beginButton) {
    beginButton.addEventListener("click", (event) => {
        event.preventDefault(); 
        const clickSound = new Audio('/sound/menubutton.mp3');
        clickSound.volume = 0.4;
        clickSound.play().then(() => {
            setTimeout(() => {
                window.location.href = "/pages/interface.html"; 
            }, 300); 
        }).catch(error => {
            console.warn('Could not play click sound:', error);
            setTimeout(() => {
                window.location.href = "/pages/interface.html"; 
            }, 300);
        });
    });
}