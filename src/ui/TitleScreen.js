// Minimal title screen: "Anthophrenor α" + a Start button. Left-click on
// the button is the only way in — no keyboard fallback. Courier New, no
// imagery, no tagline, per spec.
export class TitleScreen {
  constructor(container) {
    this.container = container;
    this.el = null;
  }

  show(onStart) {
    this.el = document.createElement('div');
    this.el.className = 'title-screen';
    this.el.innerHTML = `
      <h1>Anthophrenor α</h1>
      <button type="button" class="start-button">Start</button>
    `;
    this.container.appendChild(this.el);

    const startButton = this.el.querySelector('.start-button');
    // Explicit left-button-only check — don't use {once:true}, since that
    // would remove the listener on the first click regardless of button,
    // silently disabling Start after a stray right/middle click.
    const onClick = (e) => {
      if (e.button !== 0) return;
      startButton.removeEventListener('click', onClick);
      onStart();
    };
    startButton.addEventListener('click', onClick);
  }

  hide() {
    this.el?.remove();
    this.el = null;
  }
}
