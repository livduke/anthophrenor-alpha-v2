// Uniform wrapper whether backed by a real audio file or silence, so
// typewriter-sync callers never need to change when real audio drops in —
// only the `src` string in scenes.js changes.
export class AudioCue {
  constructor(src, { fallbackDuration = 3.5 } = {}) {
    this.src = src;
    this.duration = fallbackDuration;
    this._audio = src ? new Audio(src) : null;

    if (this._audio) {
      this._audio.addEventListener('loadedmetadata', () => {
        if (isFinite(this._audio.duration)) this.duration = this._audio.duration;
      });
    }
  }

  play() {
    if (this._audio) {
      this._audio.currentTime = 0;
      return this._audio.play().catch(() => {});
    }
    return Promise.resolve();
  }

  stop() {
    if (this._audio) this._audio.pause();
  }
}
