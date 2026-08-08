// Drifting corrupted-text fragments, optional per scene (spec: off by
// default). Plain DOM overlay elements, simple CSS-driven drift/fade.
export function createAmbientTextLayer(fragments) {
  const els = [];
  for (let i = 0; i < fragments.length; i += 1) {
    const el = document.createElement('div');
    el.className = 'ambient-text';
    el.textContent = fragments[i];
    el.style.left = `${10 + Math.random() * 70}%`;
    el.style.top = `${10 + Math.random() * 70}%`;
    el.style.animationDelay = `${Math.random() * 4}s`;
    document.body.appendChild(el);
    els.push(el);
  }
  return {
    dispose() {
      els.forEach((el) => el.remove());
    },
  };
}
