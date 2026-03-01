import css from './playback-controls.css?inline';

export class PlaybackControls extends HTMLElement {
  private _btnPlay!: HTMLButtonElement;
  private _btnStep!: HTMLElement;
  private _btnReset!: HTMLElement;
  private _stepIndicator!: HTMLElement;
  private _speedBtns!: NodeListOf<HTMLElement>;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot!.innerHTML = `
      <style>${css}</style>
      <div class="controls">
        <button class="btn btn-primary" id="btnPlay">&#9654; Play</button>
        <button class="btn" id="btnStep">&#9193; Step</button>
        <button class="btn" id="btnReset">&#8634; Reset</button>
        <div class="speed-control">
          <span>Speed:</span>
          <button class="speed-btn active" data-speed="1">1&times;</button>
          <button class="speed-btn" data-speed="2">2&times;</button>
          <button class="speed-btn" data-speed="3">3&times;</button>
        </div>
        <div class="step-indicator" id="stepIndicator"></div>
      </div>
    `;

    this._btnPlay = this.shadowRoot!.getElementById('btnPlay') as HTMLButtonElement;
    this._btnStep = this.shadowRoot!.getElementById('btnStep')!;
    this._btnReset = this.shadowRoot!.getElementById('btnReset')!;
    this._stepIndicator = this.shadowRoot!.getElementById('stepIndicator')!;
    this._speedBtns = this.shadowRoot!.querySelectorAll<HTMLElement>('.speed-btn');

    this._btnPlay.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('play-requested', { bubbles: true }));
    });

    this._btnStep.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('step-requested', { bubbles: true }));
    });

    this._btnReset.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('reset-requested', { bubbles: true }));
    });

    this._speedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const speed = Number(btn.dataset.speed);
        this._speedBtns.forEach(b => b.classList.toggle('active', Number(b.dataset.speed) === speed));
        this.dispatchEvent(new CustomEvent('speed-changed', { bubbles: true, detail: { speed } }));
      });
    });
  }

  setPlaying(isPlaying: boolean) {
    if (isPlaying) {
      this._btnPlay.disabled = true;
      this._btnPlay.textContent = '\u23F8 Playing';
    } else {
      this._btnPlay.disabled = false;
      this._btnPlay.textContent = '\u25B6 Play';
    }
  }

  setSpeed(s: number) {
    this._speedBtns.forEach(btn => {
      btn.classList.toggle('active', Number(btn.dataset.speed) === s);
    });
  }

  updateStepIndicator(currentStep: number, totalSteps: number) {
    this._stepIndicator.innerHTML = '';
    for (let i = 0; i < totalSteps; i++) {
      const dot = document.createElement('div');
      dot.className = 'step-dot';
      if (i < currentStep) dot.classList.add('done');
      if (i === currentStep) dot.classList.add('current');
      this._stepIndicator.appendChild(dot);
    }
  }
}

customElements.define('playback-controls', PlaybackControls);
