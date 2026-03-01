import css from './narration-bar.css?inline';

const DEFAULT_TEXT = 'Press <em>Play</em> to start the walkthrough. Each step shows how the JS runtime processes your code.';

export class NarrationBar extends HTMLElement {
  private _icon!: HTMLElement;
  private _text!: HTMLElement;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot!.innerHTML = `
      <style>${css}</style>
      <div class="narration-bar">
        <div class="narration-icon" id="icon">&#9654;</div>
        <div class="narration-text" id="text">${DEFAULT_TEXT}</div>
      </div>
    `;
    this._icon = this.shadowRoot!.getElementById('icon')!;
    this._text = this.shadowRoot!.getElementById('text')!;
  }

  setNarration(html: string, color: string, stepNum: number | null) {
    this._text.innerHTML = html;
    this._icon.style.borderColor = color || 'var(--border)';
    this._icon.style.color = color || 'var(--muted)';
    this._icon.textContent = stepNum != null ? String(stepNum) : '\u25B6';
  }

  reset() {
    this._text.innerHTML = DEFAULT_TEXT;
    this._icon.textContent = '\u25B6';
    this._icon.style.borderColor = 'var(--border)';
    this._icon.style.color = 'var(--muted)';
  }
}

customElements.define('narration-bar', NarrationBar);
