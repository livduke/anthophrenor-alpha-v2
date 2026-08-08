// Centered subtitle-style ending text, typed/synced the same way as
// callouts, displayed over the void, plus a "Return to Menu" button.
export class EndingScreen {
  constructor(container) {
    this.container = container;
    this.el = null;
    this.textEl = null;
    this.returnButton = null;
    this._typing = null;
    this._onReturnClick = null;
  }

  show(text, audioCue, onReturn) {
    this.el = document.createElement('div');
    this.el.className = 'ending-screen';
    this.el.innerHTML = '<span class="ending-text"></span>';
    this.textEl = this.el.querySelector('.ending-text');
    this.container.appendChild(this.el);

    this.returnButton = document.createElement('button');
    this.returnButton.type = 'button';
    this.returnButton.className = 'start-button return-button';
    this.returnButton.textContent = 'Return to Menu';
    this._onReturnClick = (e) => {
      if (e.button !== 0) return;
      onReturn?.();
    };
    this.returnButton.addEventListener('click', this._onReturnClick);
    this.container.appendChild(this.returnButton);

    const durationMs = (audioCue?.duration ?? 4) * 1000;
    audioCue?.play();
    this._type(text, durationMs);
  }

  _type(text, durationMs) {
    let i = 0;
    const interval = Math.max(durationMs / Math.max(text.length, 1), 16);
    this._typing = setInterval(() => {
      i += 1;
      this.textEl.textContent = text.slice(0, i);
      if (i >= text.length) {
        clearInterval(this._typing);
        this._typing = null;
      }
    }, interval);
  }

  hide() {
    if (this._typing) {
      clearInterval(this._typing);
      this._typing = null;
    }
    this.el?.remove();
    this.el = null;
    if (this.returnButton) {
      this.returnButton.removeEventListener('click', this._onReturnClick);
      this.returnButton.remove();
      this.returnButton = null;
    }
  }
}
