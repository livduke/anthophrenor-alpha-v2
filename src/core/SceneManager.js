import { sceneTree } from '../scenes.js';
import { SceneRenderer } from './SceneRenderer.js';
import { TransitionController } from './TransitionController.js';
import { AudioCue } from './AudioCue.js';

const SPAWN_HEIGHT = 1.6;
const IDLE_INTENSITY = 0.05;

// Walks the data-driven scene tree: owns the persistent scene renderer,
// transition controller, and title/ending screens, and routes between
// nodes based on which object's portal fires.
export class SceneManager {
  constructor({ scene, camera, renderer, postFX, inputController, calloutBox, titleScreen, endingScreen }) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.postFX = postFX;
    this.inputController = inputController;
    this.calloutBox = calloutBox;
    this.titleScreen = titleScreen;
    this.endingScreen = endingScreen;

    this.sceneRenderer = new SceneRenderer(scene, { calloutBox, postFX });
    this.sceneRenderer.onPortalFire((objectId, leadsTo, worldPos) => this._fireTransition(leadsTo, worldPos));

    this.transitionController = new TransitionController({ camera, renderer, postFX });
    this.inputController.onObjectClick((id) => this.sceneRenderer.handleObjectClick(id));

    this.currentId = null;
  }

  start() {
    this.titleScreen.show(() => {
      this.titleScreen.hide();
      this.inputController.enable();
      this.inputController.requestLock();
      this.load('scene_threshold');
    });
  }

  load(sceneId) {
    const config = sceneTree[sceneId];
    this.currentId = sceneId;

    if (config.type === 'ending') {
      this._playEnding(config);
      return;
    }

    this.sceneRenderer.dispose();
    this.sceneRenderer.build(config);
    this.inputController.setBounds(config.room.size);
    this.inputController.setClickTargets(this.sceneRenderer.getClickTargets());

    const [, , d] = config.room.size;
    this.camera.position.set(0, SPAWN_HEIGHT, d / 2 - 1);
    this.camera.rotation.set(0, 0, 0);
    this.postFX.setIntensity(IDLE_INTENSITY);
  }

  _fireTransition(leadsTo, worldPos) {
    this.transitionController.play(worldPos, {
      skipHeld: () => this.inputController.skipHeld,
      onArrive: () => this.load(leadsTo),
      isEnding: sceneTree[leadsTo]?.type === 'ending',
    });
  }

  _playEnding(config) {
    this.sceneRenderer.dispose();
    this.inputController.setClickTargets([]);
    this.inputController.releaseLock();
    // Disable (not dispose) — the ending has no more room interactions, and
    // a stray click on the canvas behind the ending-screen box would
    // otherwise re-request pointer lock and bring the crosshair back. Kept
    // alive (vs. dispose) so Return to Menu can re-enable it for a replay.
    this.inputController.disable();
    this.transitionController.holdVoid();
    const audioCue = new AudioCue(config.audio, { fallbackDuration: 4 });
    this.endingScreen.show(config.endingText, audioCue, () => this._returnToMenu());
  }

  _returnToMenu() {
    this.endingScreen.hide();
    this.transitionController.reset();
    this.start();
  }

  update(delta) {
    this.inputController.update(delta);
    this.transitionController.update(delta);
    this.postFX.update(delta);

    if (!this.transitionController.isActive) {
      this.sceneRenderer.update(delta);
    }
  }

  render() {
    if (this.transitionController.isVoid) {
      this.transitionController.renderVoid();
    } else {
      this.postFX.render();
    }
  }

  setSize(width, height) {
    this.transitionController.setSize(width, height);
  }
}
