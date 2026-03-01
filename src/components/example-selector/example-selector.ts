import css from './example-selector.css?inline';

const EXAMPLES = [
  {
    title: 'setTimeout vs Promise ordering',
    description: 'What order do the console.logs print?',
    categories: ['event-loop'],
    code: [
      'console.log("1");',
      '',
      'setTimeout(() => {',
      '  console.log("2");',
      '}, 0);',
      '',
      'Promise.resolve()',
      '  .then(() => console.log("3"));',
      '',
      'console.log("4");',
    ].join('\n'),
  },
  {
    title: 'setTimeout(fn, 0) isn\'t immediate',
    description: 'Zero delay doesn\'t mean zero wait time.',
    categories: ['event-loop'],
    code: [
      'console.log("start");',
      '',
      'setTimeout(() => {',
      '  console.log("timeout");',
      '}, 0);',
      '',
      'console.log("middle");',
      '',
      'console.log("end");',
    ].join('\n'),
  },
  {
    title: 'Promise.resolve().then vs queueMicrotask',
    description: 'Both are microtasks \u2014 which runs first?',
    categories: ['promises'],
    code: [
      'console.log("start");',
      '',
      'Promise.resolve()',
      '  .then(() => console.log("promise"));',
      '',
      'queueMicrotask(() => console.log("microtask"));',
      '',
      'console.log("end");',
    ].join('\n'),
  },
  {
    title: 'Nested setTimeout callbacks',
    description: 'Each setTimeout callback schedules the next.',
    categories: ['event-loop'],
    code: [
      'console.log("start");',
      '',
      'setTimeout(() => {',
      '  console.log("timeout 1");',
      '}, 0);',
      '',
      'setTimeout(() => {',
      '  console.log("timeout 2");',
      '}, 0);',
      '',
      'console.log("end");',
    ].join('\n'),
  },
  {
    title: 'Multiple Promise.then chains',
    description: 'Two independent promise chains \u2014 what\'s the order?',
    categories: ['promises'],
    code: [
      'console.log("start");',
      '',
      'Promise.resolve()',
      '  .then(() => console.log("promise 1a"))',
      '  .then(() => console.log("promise 1b"));',
      '',
      'Promise.resolve()',
      '  .then(() => console.log("promise 2a"))',
      '  .then(() => console.log("promise 2b"));',
      '',
      'console.log("end");',
    ].join('\n'),
  },
  {
    title: 'Mixed sync, micro, and macro',
    description: 'Sync, microtask, and macrotask all in one.',
    categories: ['event-loop'],
    code: [
      'console.log("A");',
      '',
      'setTimeout(() => console.log("B"), 0);',
      '',
      'Promise.resolve()',
      '  .then(() => console.log("C"));',
      '',
      'setTimeout(() => console.log("D"), 0);',
      '',
      'Promise.resolve()',
      '  .then(() => console.log("E"));',
      '',
      'console.log("F");',
    ].join('\n'),
  },
  {
    title: 'var hoisting in setTimeout loop',
    description: 'The classic closure trap with var and setTimeout.',
    categories: ['closures'],
    code: [
      'for (var i = 0; i < 3; i++) {',
      '  setTimeout(() => {',
      '    console.log(i);',
      '  }, 0);',
      '}',
      '',
      'console.log("after loop");',
    ].join('\n'),
  },
  {
    title: 'let fixes the closure trap',
    description: 'Block scoping gives each iteration its own binding.',
    categories: ['closures'],
    code: [
      'for (let i = 0; i < 3; i++) {',
      '  setTimeout(() => {',
      '    console.log(i);',
      '  }, 0);',
      '}',
      '',
      'console.log("after loop");',
    ].join('\n'),
  },
  {
    title: 'Closure captures variable, not value',
    description: 'The callback sees the variable\'s value at execution time.',
    categories: ['closures'],
    code: [
      'var x = 1;',
      '',
      'setTimeout(() => {',
      '  console.log(x);',
      '}, 0);',
      '',
      'x = 99;',
      '',
      'console.log("updated x");',
    ].join('\n'),
  },
  {
    title: 'IIFE execution timing',
    description: 'IIFEs run synchronously and immediately.',
    categories: ['hoisting'],
    code: [
      'console.log("before");',
      '',
      '(function() {',
      '  console.log("IIFE");',
      '})();',
      '',
      'console.log("after");',
    ].join('\n'),
  },
  {
    title: 'Promise executor runs synchronously',
    description: 'The function passed to new Promise runs right away.',
    categories: ['promises'],
    code: [
      'console.log("start");',
      '',
      'const p = new Promise((resolve) => {',
      '  console.log("executor");',
      '  resolve("done");',
      '});',
      '',
      'p.then((val) => console.log(val));',
      '',
      'console.log("end");',
    ].join('\n'),
  },
  {
    title: 'Microtask queue drains before macrotasks',
    description: 'All microtasks finish before ANY macrotask runs.',
    categories: ['event-loop'],
    code: [
      'setTimeout(() => console.log("macro"), 0);',
      '',
      'Promise.resolve()',
      '  .then(() => console.log("micro 1"));',
      '',
      'Promise.resolve()',
      '  .then(() => console.log("micro 2"));',
      '',
      'Promise.resolve()',
      '  .then(() => console.log("micro 3"));',
      '',
      'console.log("sync");',
    ].join('\n'),
  },
  {
    title: 'Promise.then vs setTimeout interleaving',
    description: 'Microtasks always run before the next macrotask.',
    categories: ['promises'],
    code: [
      'console.log("start");',
      '',
      'Promise.resolve()',
      '  .then(() => console.log("then 1"));',
      '',
      'setTimeout(() => {',
      '  console.log("timeout");',
      '}, 0);',
      '',
      'Promise.resolve()',
      '  .then(() => console.log("then 2"));',
      '',
      'console.log("end");',
    ].join('\n'),
  },
  {
    title: 'Chained .then() callback order',
    description: 'Each .then returns a new promise that queues the next.',
    categories: ['promises'],
    code: [
      'console.log("start");',
      '',
      'Promise.resolve()',
      '  .then(() => {',
      '    console.log("then 1");',
      '  })',
      '  .then(() => {',
      '    console.log("then 2");',
      '  })',
      '  .then(() => {',
      '    console.log("then 3");',
      '  });',
      '',
      'console.log("end");',
    ].join('\n'),
  },
  {
    title: 'Microtask priority over macrotask',
    description: 'Promise callbacks always beat setTimeout callbacks.',
    categories: ['event-loop'],
    code: [
      'console.log("start");',
      '',
      'setTimeout(() => {',
      '  console.log("setTimeout");',
      '}, 0);',
      '',
      'Promise.resolve()',
      '  .then(() => console.log("promise"));',
      '',
      'console.log("end");',
    ].join('\n'),
  },
  {
    title: 'try/catch can\'t catch async errors',
    description: 'try/catch only works synchronously.',
    categories: ['promises'],
    code: [
      'console.log("start");',
      '',
      'try {',
      '  setTimeout(() => {',
      '    console.log("timeout runs");',
      '  }, 0);',
      '} catch (e) {',
      '  console.log("caught");',
      '}',
      '',
      'console.log("end");',
    ].join('\n'),
  },
  {
    title: 'Recursive microtask chains',
    description: 'Microtasks that schedule more microtasks run first.',
    categories: ['event-loop'],
    code: [
      'console.log("start");',
      '',
      'setTimeout(() => {',
      '  console.log("timeout");',
      '}, 0);',
      '',
      'Promise.resolve()',
      '  .then(() => console.log("micro 1"))',
      '  .then(() => console.log("micro 2"))',
      '  .then(() => console.log("micro 3"));',
      '',
      'console.log("end");',
    ].join('\n'),
  },

  // ── Real World ──────────────────────────────────────────────

  {
    title: 'User login flow',
    description: 'The Promise executor validates credentials synchronously.',
    categories: ['real-world', 'promises'],
    code: [
      'console.log("login clicked");',
      '',
      'const authResult = new Promise((resolve) => {',
      '  console.log("validating credentials");',
      '  resolve("session_abc123");',
      '});',
      '',
      'authResult.then((token) => console.log(token));',
      '',
      'console.log("showing spinner");',
    ].join('\n'),
  },
  {
    title: 'Checkout payment vs inventory',
    description: 'Which fires first \u2014 the payment webhook or inventory update?',
    categories: ['real-world', 'event-loop'],
    code: [
      'console.log("order placed");',
      '',
      'setTimeout(() => {',
      '  console.log("inventory updated");',
      '}, 0);',
      '',
      'Promise.resolve()',
      '  .then(() => console.log("payment confirmed"));',
      '',
      'console.log("confirmation page");',
    ].join('\n'),
  },
  {
    title: 'Notification delivery order',
    description: 'All notification microtasks drain before the batch flush.',
    categories: ['real-world', 'event-loop'],
    code: [
      'setTimeout(() => console.log("batch flush"), 0);',
      '',
      'Promise.resolve()',
      '  .then(() => console.log("email sent"));',
      '',
      'Promise.resolve()',
      '  .then(() => console.log("sms sent"));',
      '',
      'Promise.resolve()',
      '  .then(() => console.log("push delivered"));',
      '',
      'console.log("notifications queued");',
    ].join('\n'),
  },
  {
    title: 'Tab switcher var bug',
    description: 'Every tab handler shows the same wrong index.',
    categories: ['real-world', 'closures'],
    code: [
      'for (var tabIndex = 0; tabIndex < 3; tabIndex++) {',
      '  setTimeout(() => {',
      '    console.log(tabIndex);',
      '  }, 0);',
      '}',
      '',
      'console.log("tabs bound");',
    ].join('\n'),
  },
  {
    title: 'Cache version race condition',
    description: 'The stale cache version is overwritten before the callback reads it.',
    categories: ['real-world', 'closures'],
    code: [
      'var cacheVersion = 1;',
      '',
      'setTimeout(() => {',
      '  console.log(cacheVersion);',
      '}, 0);',
      '',
      'cacheVersion = 2;',
      '',
      'console.log("cache invalidated");',
    ].join('\n'),
  },
  {
    title: 'API call with analytics logging',
    description: 'Sync validation, async fetch response, and deferred analytics.',
    categories: ['real-world', 'event-loop'],
    code: [
      'console.log("request started");',
      '',
      'setTimeout(() => console.log("analytics sent"), 0);',
      '',
      'Promise.resolve()',
      '  .then(() => console.log("user data loaded"));',
      '',
      'setTimeout(() => console.log("prefetch next page"), 0);',
      '',
      'Promise.resolve()',
      '  .then(() => console.log("cache warmed"));',
      '',
      'console.log("loading skeleton shown");',
    ].join('\n'),
  },
  {
    title: 'Database query pipeline',
    description: 'Each chained .then waits for the previous step to finish.',
    categories: ['real-world', 'promises'],
    code: [
      'console.log("opening connection");',
      '',
      'Promise.resolve()',
      '  .then(() => {',
      '    console.log("query executed");',
      '  })',
      '  .then(() => {',
      '    console.log("rows mapped");',
      '  })',
      '  .then(() => {',
      '    console.log("connection released");',
      '  });',
      '',
      'console.log("pool available");',
    ].join('\n'),
  },
  {
    title: 'Form submit with toast',
    description: 'Validation promise resolves before the toast timeout fires.',
    categories: ['real-world', 'promises'],
    code: [
      'console.log("submit clicked");',
      '',
      'Promise.resolve()',
      '  .then(() => console.log("fields validated"));',
      '',
      'setTimeout(() => {',
      '  console.log("toast shown");',
      '}, 0);',
      '',
      'Promise.resolve()',
      '  .then(() => console.log("data saved"));',
      '',
      'console.log("button disabled");',
    ].join('\n'),
  },
  {
    title: 'Session expiry with try/catch',
    description: 'try/catch can\'t catch the timeout \u2014 it already ran.',
    categories: ['real-world', 'promises'],
    code: [
      'console.log("session started");',
      '',
      'try {',
      '  setTimeout(() => {',
      '    console.log("session expired");',
      '  }, 0);',
      '} catch (e) {',
      '  console.log("caught expiry");',
      '}',
      '',
      'console.log("session active");',
    ].join('\n'),
  },
  {
    title: 'Rate limiter slot assignment',
    description: 'let gives each request its own slot number.',
    categories: ['real-world', 'closures'],
    code: [
      'for (let requestId = 0; requestId < 3; requestId++) {',
      '  setTimeout(() => {',
      '    console.log(requestId);',
      '  }, 0);',
      '}',
      '',
      'console.log("rate limiter ready");',
    ].join('\n'),
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'event-loop', label: 'Event Loop' },
  { id: 'promises', label: 'Promises' },
  { id: 'closures', label: 'Closures' },
  { id: 'hoisting', label: 'Hoisting' },
  { id: 'real-world', label: 'Real World' },
];

export class ExampleSelector extends HTMLElement {
  private _activeFilter: string;
  private _filters!: HTMLElement;
  private _grid!: HTMLElement;

  constructor() {
    super();
    this._activeFilter = 'all';
    this.attachShadow({ mode: 'open' });
    this.shadowRoot!.innerHTML = `
      <style>${css}</style>
      <div class="selector-panel">
        <div class="selector-header">
          <span class="selector-title">Pick an interview question</span>
          <div class="category-filters" id="filters"></div>
        </div>
        <div class="examples-grid" id="grid"></div>
      </div>
    `;

    this._filters = this.shadowRoot!.getElementById('filters')!;
    this._grid = this.shadowRoot!.getElementById('grid')!;

    this._renderFilters();
    this._renderCards();
    this._bindEvents();
  }

  _renderFilters() {
    this._filters.innerHTML = CATEGORIES.map(cat =>
      `<button class="filter-btn${cat.id === 'all' ? ' active' : ''}" data-cat="${cat.id}">${cat.label}</button>`
    ).join('');
  }

  _renderCards() {
    this._grid.innerHTML = EXAMPLES.map((ex, i) => {
      const tags = ex.categories.map(c =>
        `<span class="tag tag-${c}">${c}</span>`
      ).join('');
      return `
        <button class="example-card" data-index="${i}" data-categories="${ex.categories.join(',')}">
          <span class="example-number">${String(i + 1).padStart(2, '0')}</span>
          <span class="example-title">${ex.title}</span>
          <span class="example-desc">${ex.description}</span>
          <span class="example-tags">${tags}</span>
        </button>
      `;
    }).join('');
  }

  _bindEvents() {
    this._filters.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('.filter-btn') as HTMLElement | null;
      if (!btn) return;
      this._activeFilter = btn.dataset.cat!;
      this._filters.querySelectorAll<HTMLElement>('.filter-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.cat === this._activeFilter)
      );
      this._applyFilter();
    });

    this._grid.addEventListener('click', (e) => {
      const card = (e.target as HTMLElement).closest('.example-card') as HTMLElement | null;
      if (!card) return;
      const index = Number(card.dataset.index);
      const ex = EXAMPLES[index];
      this.dispatchEvent(new CustomEvent('example-selected', {
        bubbles: true,
        detail: { index, title: ex.title, description: ex.description, code: ex.code },
      }));
    });
  }

  _applyFilter() {
    const cards = this._grid.querySelectorAll<HTMLElement>('.example-card');
    cards.forEach(card => {
      const cats = card.dataset.categories!.split(',');
      const show = this._activeFilter === 'all' || cats.includes(this._activeFilter);
      card.classList.toggle('hidden', !show);
    });
  }

  selectExample(index: number) {
    const ex = EXAMPLES[index];
    if (!ex) return;
    this.dispatchEvent(new CustomEvent('example-selected', {
      bubbles: true,
      detail: { index, title: ex.title, description: ex.description, code: ex.code },
    }));
  }
}

customElements.define('example-selector', ExampleSelector);
