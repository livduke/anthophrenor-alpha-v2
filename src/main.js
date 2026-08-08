import * as THREE from 'three';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { PostFX } from './render/PostFX.js';
import { InputController } from './core/InputController.js';
import { CalloutBox } from './ui/CalloutBox.js';
import { TitleScreen } from './ui/TitleScreen.js';
import { EndingScreen } from './ui/EndingScreen.js';
import { SceneManager } from './core/SceneManager.js';
import './style.css';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0000ff);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);

const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const css2dRenderer = new CSS2DRenderer();
css2dRenderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('css2d-root').appendChild(css2dRenderer.domElement);

const domOverlay = document.getElementById('dom-overlay');

const postFX = new PostFX(renderer, scene, camera);
const inputController = new InputController(camera, renderer.domElement);
const calloutBox = new CalloutBox();
const titleScreen = new TitleScreen(domOverlay);
const endingScreen = new EndingScreen(domOverlay);

const sceneManager = new SceneManager({
  scene,
  camera,
  renderer,
  postFX,
  inputController,
  calloutBox,
  titleScreen,
  endingScreen,
});

sceneManager.start();

const crosshairEl = document.getElementById('crosshair');
document.addEventListener('pointerlockchange', () => {
  const locked = document.pointerLockElement === renderer.domElement;
  crosshairEl.classList.toggle('visible', locked);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  css2dRenderer.setSize(window.innerWidth, window.innerHeight);
  postFX.setSize(window.innerWidth, window.innerHeight);
  sceneManager.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.1);

  sceneManager.update(delta);
  sceneManager.render();
  css2dRenderer.render(scene, camera);
}

animate();
