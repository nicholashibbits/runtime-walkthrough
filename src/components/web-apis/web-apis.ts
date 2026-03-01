import baseCSS from '../runtime-box.css?inline';
import css from './web-apis.css?inline';

export class WebApis extends HTMLElement {
  private _box!: HTMLElement;
  private _items!: HTMLElement;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot!.innerHTML = `
      <style>${baseCSS}\n${css}</style>
      <div class="runtime-box glow-webapi" id="box">
        <div class="box-label"><span class="dot"></span> browser</div>
        <div class="box-title">Web APIs <span class="tooltip-trigger">?<span class="tooltip-popup">Browser-provided interfaces (setTimeout, fetch, DOM events) that handle async operations outside the JS engine.<a href="https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Client-side_APIs/Introduction" target="_blank">MDN: Web APIs &rarr;</a></span></span></div>
        <div class="webapi-items" id="items"></div>
      </div>
    `;
    this._box = this.shadowRoot!.getElementById('box')!;
    this._items = this.shadowRoot!.getElementById('items')!;
  }

  addWebApi(label: string, timer: string) {
    const item = document.createElement('div');
    item.className = 'webapi-item';
    item.dataset.label = label;
    item.innerHTML = `<span>${label}</span><span class="webapi-timer">${timer}</span>`;
    this._items.appendChild(item);
  }

  removeWebApi(label: string) {
    const items = this._items.querySelectorAll<HTMLElement>('.webapi-item');
    for (const item of items) {
      if (item.dataset.label === label) {
        item.style.opacity = '0';
        item.style.transform = 'translateX(15px)';
        item.style.transition = 'all 0.3s';
        setTimeout(() => item.remove(), 300);
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

customElements.define('web-apis', WebApis);
