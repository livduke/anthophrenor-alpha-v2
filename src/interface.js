
let audioStarted = false;

let scene, camera, renderer;
let tendrils = [];
let growing = false;
let overlay;

function init() {
  console.log("Initializing Three.js scene...");

  scene = new THREE.Scene();
  scene.background = null;

  camera = new THREE.OrthographicCamera(
    window.innerWidth / -2, window.innerWidth / 2,
    window.innerHeight / 2, window.innerHeight / -2,
    1, 1000
  );
  camera.position.z = 10;

  renderer = new THREE.WebGLRenderer({ 
    antialias: true, 
    alpha: true,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setClearAlpha(0);
  renderer.setSize(window.innerWidth, window.innerHeight);

  let canvasContainer = document.getElementById("canvas-container");
  canvasContainer.appendChild(renderer.domElement);
  console.log("Renderer added to the document.");

  overlay = document.createElement("div");
  overlay.style.position = "absolute";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.background = "black";
  overlay.style.opacity = "0";
  overlay.style.transition = "opacity 3s";
  overlay.style.zIndex = "2";
  document.body.appendChild(overlay);

  createTendrils(20);
  animate();
}

function createTendrils(count) {
  for (let i = 0; i < count; i++) {
    let startX, startY;
    let edge = Math.floor(Math.random() * 4);

    switch (edge) {
      case 0:
        startX = Math.random() * window.innerWidth - window.innerWidth / 2;
        startY = window.innerHeight / 2;
        break;
      case 1:
        startX = window.innerWidth / 2;
        startY = Math.random() * window.innerHeight - window.innerHeight / 2;
        break;
      case 2:
        startX = Math.random() * window.innerWidth - window.innerWidth / 2;
        startY = -window.innerHeight / 2;
        break;
      case 3:
        startX = -window.innerWidth / 2;
        startY = Math.random() * window.innerHeight - window.innerHeight / 2;
        break;
    }

    let tendril = {
      points: [new THREE.Vector3(startX, startY, 0)],
      line: null
    };
    tendrils.push(tendril);
    updateLine(tendril);
  }

  console.log("Tendrils initialized:", tendrils.length);
}

function updateLine(tendril) {
  if (tendril.line) scene.remove(tendril.line);

  let geometry = new THREE.BufferGeometry().setFromPoints(tendril.points);
  let material = new THREE.LineBasicMaterial({ 
    color: 0x110d55,
    transparent: true,
    opacity: 1
  });
  tendril.line = new THREE.Line(geometry, material);
  scene.add(tendril.line);
}

function growTendrils() {
  if (!growing) return;

  console.log("Growing tendrils...");

  tendrils.forEach(tendril => {
    let lastPoint = tendril.points[tendril.points.length - 1];
    let angle = Math.random() * Math.PI * 2;
    let stepSize = Math.random() * 15 + 5;
    let newPoint = new THREE.Vector3(
      lastPoint.x + Math.cos(angle) * stepSize,
      lastPoint.y + Math.sin(angle) * stepSize,
      0
    );

    tendril.points.push(newPoint);
    updateLine(tendril);
  });

  let coverage = tendrils.reduce((sum, t) => sum + t.points.length, 0) / 10000;
  overlay.style.opacity = Math.min(coverage, 1);

  if (coverage >= 1) {
    console.log("Transitioning to mindspace.html...");
    setTimeout(() => {
      window.location.href = "/pages/mindspace.html";
    }, 3000);
  }
}

function animate() {
  requestAnimationFrame(animate);
  renderer.setClearColor(0x000000, 0);
  renderer.setClearAlpha(0);

  if (growing) growTendrils();
  renderer.render(scene, camera);
}

function hideDraggableImages() {
  const draggablePortal = document.getElementById("draggable-portal");
  const draggableEjournal = document.getElementById("draggable-ejournal");
  const draggableMessages = document.getElementById("draggable-messages");

  if (draggablePortal) {
    draggablePortal.style.transition = "opacity 1.5s";
    draggablePortal.style.opacity = "0";
  }

  if (draggableEjournal) {
    draggableEjournal.style.transition = "opacity 1.5s";
    draggableEjournal.style.opacity = "0";
  }

  if (draggableMessages) {
    draggableMessages.style.transition = "opacity 1.5s";
    draggableMessages.style.opacity = "0";
  }

  setTimeout(() => {
    if (draggablePortal) draggablePortal.remove();
    if (draggableEjournal) draggableEjournal.remove();
    if (draggableMessages) draggableMessages.remove();
  }, 1500);
}

function startGrowth() {
  if (!growing) {
    console.log("Starting mycelium growth!");
    growing = true;
    document.getElementById("bottom-text")?.remove();
    hideDraggableImages();
  }
}

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.left = window.innerWidth / -2;
  camera.right = window.innerWidth / 2;
  camera.top = window.innerHeight / 2;
  camera.bottom = window.innerHeight / -2;
  camera.updateProjectionMatrix();
});

init();


document.getElementById("enter-button").addEventListener("click", () => {
  if (!growing) {
    console.log("Button click - starting growth!");
    startGrowth();
  }
});
