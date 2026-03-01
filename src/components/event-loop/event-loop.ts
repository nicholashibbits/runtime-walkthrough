import baseCSS from '../runtime-box.css?inline';
import css from './event-loop.css?inline';

export class EventLoop extends HTMLElement {
  private _box!: HTMLElement;
  private _ring!: HTMLElement;
  private _label!: HTMLElement;
  private _status!: HTMLElement;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot!.innerHTML = `
      <style>${baseCSS}\n${css}</style>
      <div class="runtime-box glow-eventloop" id="box">
        <div class="box-label"><span class="dot"></span> runtime</div>
        <div class="box-title">Event Loop</div>
        <div class="eventloop-visual">
          <div class="loop-ring-container">
            <div class="loop-ring" id="ring"></div>
            <div class="loop-label" id="label">idle</div>
          </div>
          <div class="loop-status" id="status"></div>
        </div>
      </div>
    `;
    this._box = this.shadowRoot!.getElementById('box')!;
    this._ring = this.shadowRoot!.getElementById('ring')!;
    this._label = this.shadowRoot!.getElementById('label')!;
    this._status = this.shadowRoot!.getElementById('status')!;
  }

  setState(state: string) {
    if (state === 'checking') {
      this._ring.classList.add('spinning');
      this._label.textContent = '?';
      this._status.textContent = 'checking queues\u2026';
      this._status.classList.add('active');
    } else if (state === 'idle') {
      this._ring.classList.remove('spinning');
      this._label.textContent = 'idle';
      this._status.textContent = 'waiting for events';
      this._status.classList.remove('active');
    } else {
      this._ring.classList.remove('spinning');
      this._label.textContent = 'idle';
      this._status.textContent = '';
      this._status.classList.remove('active');
    }
  }

  setGlow(on: boolean) {
    this._box.classList.toggle('glow', on);
  }
}

customElements.define('event-loop', EventLoop);
