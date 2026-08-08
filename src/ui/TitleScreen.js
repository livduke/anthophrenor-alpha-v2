// Minimal title screen: "The Anthophrenors" + a click/press-to-start
// prompt. Courier New, no imagery, no tagline, per spec.
export class TitleScreen {
  constructor(container) {
    this.container = container;
    this.el = null;
  }

  show(onStart) {
    this.el = document.createElement('div');
    this.el.className = 'title-screen';
    this.el.innerHTML = `
      <h1>The Anthophrenors</h1>
      <p class="prompt">click / press any key to start</p>
    `;
    this.container.appendChild(this.el);

    const start = () => {
      document.removeEventListener('keydown', start);
      this.el?.removeEventListener('click', start);
      onStart();
    };
    document.addEventListener('keydown', start, { once: true });
    this.el.addEventListener('click', start, { once: true });
  }

  hide() {
    this.el?.remove();
    this.el = null;
  }
}
