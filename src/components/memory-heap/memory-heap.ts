import baseCSS from '../runtime-box.css?inline';
import css from './memory-heap.css?inline';

export class MemoryHeap extends HTMLElement {
  private _box!: HTMLElement;
  private _items!: HTMLElement;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot!.innerHTML = `
      <style>${baseCSS}\n${css}</style>
      <div class="runtime-box glow-heap" id="box">
        <div class="box-label"><span class="dot"></span> engine</div>
        <div class="box-title">Memory Heap <span class="tooltip-trigger">?<span class="tooltip-popup">Unstructured memory region where objects, strings, and closures are dynamically allocated during execution.<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management" target="_blank">MDN: Memory Management &rarr;</a></span></span></div>
        <div class="heap-items" id="items"></div>
      </div>
    `;
    this._box = this.shadowRoot!.getElementById('box')!;
    this._items = this.shadowRoot!.getElementById('items')!;
  }

  allocHeap(label: string) {
    const item = document.createElement('div');
    item.className = 'heap-item';
    item.textContent = label;
    this._items.appendChild(item);
  }

  clear() {
    this._items.innerHTML = '';
  }

  setGlow(on: boolean) {
    this._box.classList.toggle('glow', on);
  }
}

customElements.define('memory-heap', MemoryHeap);
