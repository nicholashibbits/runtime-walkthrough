import baseCSS from '../runtime-box.css?inline';
import css from './call-stack.css?inline';

export class CallStack extends HTMLElement {
  private _box!: HTMLElement;
  private _frames!: HTMLElement;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot!.innerHTML = `
      <style>${baseCSS}\n${css}</style>
      <div class="runtime-box glow-stack" id="box">
        <div class="box-label"><span class="dot"></span> engine</div>
        <div class="box-title">Call Stack <span class="tooltip-trigger">?<span class="tooltip-popup">Tracks function execution order using LIFO (last in, first out). Each function call pushes a frame; returning pops it off.<a href="https://developer.mozilla.org/en-US/docs/Glossary/Call_stack" target="_blank">MDN: Call Stack &rarr;</a></span></span></div>
        <div class="stack-container" id="frames"></div>
      </div>
    `;
    this._box = this.shadowRoot!.getElementById('box')!;
    this._frames = this.shadowRoot!.getElementById('frames')!;
  }

  pushStack(label: string) {
    const frame = document.createElement('div');
    frame.className = 'stack-frame';
    frame.textContent = label;
    frame.dataset.label = label;
    this._frames.appendChild(frame);
  }

  popStack(delay: number): Promise<void> {
    return new Promise<void>(resolve => {
      setTimeout(() => {
        const last = this._frames.lastElementChild as HTMLElement | null;
        if (last) {
          last.classList.add('popping');
          setTimeout(() => { last.remove(); resolve(); }, 300);
        } else {
          resolve();
        }
      }, delay);
    });
  }

  clear() {
    this._frames.innerHTML = '';
  }

  setGlow(on: boolean) {
    this._box.classList.toggle('glow', on);
  }
}

customElements.define('call-stack', CallStack);
