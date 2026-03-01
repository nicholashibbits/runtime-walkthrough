import baseCSS from '../runtime-box.css?inline';
import css from './console-output.css?inline';

export class ConsoleOutput extends HTMLElement {
  private _box!: HTMLElement;
  private _lines!: HTMLElement;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot!.innerHTML = `
      <style>${baseCSS}\n${css}</style>
      <div class="runtime-box glow-console" id="box">
        <div class="box-label"><span class="dot"></span> output</div>
        <div class="box-title">Console <span class="tooltip-trigger">?<span class="tooltip-popup">Displays output from console.log() and other console methods, reflecting the runtime order of execution.<a href="https://developer.mozilla.org/en-US/docs/Web/API/console" target="_blank">MDN: Console API &rarr;</a></span></span></div>
        <div class="console-lines" id="lines"></div>
      </div>
    `;
    this._box = this.shadowRoot!.getElementById('box')!;
    this._lines = this.shadowRoot!.getElementById('lines')!;
  }

  log(text: string) {
    const line = document.createElement('div');
    line.className = 'console-line';
    line.innerHTML = `<span class="chevron">\u276F</span><span class="log-text">${text}</span>`;
    this._lines.appendChild(line);
  }

  clear() {
    this._lines.innerHTML = '';
  }

  setGlow(on: boolean) {
    this._box.classList.toggle('glow', on);
  }
}

customElements.define('console-output', ConsoleOutput);
