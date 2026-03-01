import css from './code-panel.css?inline';

export class CodePanel extends HTMLElement {
  private _filename!: HTMLElement;
  private _codeLines!: HTMLElement;
  private _btnEdit!: HTMLElement;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot!.innerHTML = `
      <style>${css}</style>
      <div class="code-panel">
        <div class="code-panel-header">
          <div class="dots"><span></span><span></span><span></span></div>
          <span class="filename" id="filename">example.js</span>
          <button class="btn-edit" id="btnEdit">Back</button>
        </div>
        <div class="code-lines" id="codeLines"></div>
      </div>
    `;
    this._filename = this.shadowRoot!.getElementById('filename')!;
    this._codeLines = this.shadowRoot!.getElementById('codeLines')!;
    this._btnEdit = this.shadowRoot!.getElementById('btnEdit')!;

    this._btnEdit.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('edit-requested', { bubbles: true }));
    });
  }

  buildCodePanel(codeLines: { html: string }[]) {
    this._codeLines.innerHTML = '';
    codeLines.forEach((line, i) => {
      const div = document.createElement('div');
      div.className = 'code-line';
      div.dataset.index = String(i);
      div.innerHTML = [
        '<div class="active-marker"></div>',
        `<span class="line-num">${i + 1}</span>`,
        `<span class="code-text">${line.html}</span>`,
      ].join('');
      this._codeLines.appendChild(div);
    });
  }

  setActiveLine(lineIdx: number | null) {
    const lines = this._codeLines.querySelectorAll<HTMLElement>('.code-line');
    lines.forEach((el, i) => {
      el.classList.remove('active');
      if (lineIdx !== null && i <= lineIdx) el.classList.add('executed');
    });

    if (lineIdx !== null && lines[lineIdx]) {
      lines[lineIdx].classList.add('active', 'executed');
    }
  }

  clearHighlights() {
    this._codeLines.querySelectorAll('.code-line').forEach(line => {
      line.classList.remove('active', 'executed');
    });
  }

  setFilename(name: string) {
    this._filename.textContent = name;
  }
}

customElements.define('code-panel', CodePanel);
