import baseCSS from '../runtime-box.css?inline';
import css from './microtask-queue.css?inline';

export class MicrotaskQueue extends HTMLElement {
  private _box!: HTMLElement;
  private _items!: HTMLElement;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot!.innerHTML = `
      <style>${baseCSS}\n${css}</style>
      <div class="runtime-box glow-microtask" id="box">
        <div class="box-label"><span class="dot"></span> runtime &middot; priority</div>
        <div class="box-title">Microtask Queue</div>
        <div class="queue-items" id="items"></div>
      </div>
    `;
    this._box = this.shadowRoot!.getElementById('box')!;
    this._items = this.shadowRoot!.getElementById('items')!;
  }

  addItem(label: string) {
    const item = document.createElement('div');
    item.className = 'queue-item';
    item.textContent = label;
    item.dataset.label = label;
    this._items.appendChild(item);
  }

  dequeueItem(label: string) {
    const items = this._items.querySelectorAll<HTMLElement>('.queue-item');
    for (const item of items) {
      if (item.dataset.label === label) {
        item.classList.add('dequeuing');
        setTimeout(() => item.remove(), 350);
        break;
      }
    }
  }

  clear() {
    this._items.innerHTML = '';
  }

  setGlow(on: boolean) {
    this._box.classList.toggle('glow', on);
  }
}

customElements.define('microtask-queue', MicrotaskQueue);
