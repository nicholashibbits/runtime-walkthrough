/* ================================================================
   RuntimeViz
   ─────────────────────────────────────────────────────────────────
   Handles all DOM manipulation for the runtime visualization
   boxes: call stack, heap, web APIs, queues, event loop, console,
   code highlighting, narration, and step indicator.

   Exposed as a single global:  RuntimeViz
   ================================================================ */

const RuntimeViz = (() => {

  // ── CACHED ELEMENTS ───────────────────────────────────────────

  const el = {
    codeLines:    () => document.getElementById('codeLines'),
    stackFrames:  () => document.getElementById('stackFrames'),
    heapItems:    () => document.getElementById('heapItems'),
    webapiItems:  () => document.getElementById('webapiItems'),
    microItems:   () => document.getElementById('microItems'),
    taskItems:    () => document.getElementById('taskItems'),
    consoleLines: () => document.getElementById('consoleLines'),
    loopRing:     () => document.getElementById('loopRing'),
    loopLabel:    () => document.getElementById('loopLabel'),
    loopStatus:   () => document.getElementById('loopStatus'),
    narrationText:() => document.getElementById('narrationText'),
    narrationIcon:() => document.getElementById('narrationIcon'),
    stepIndicator:() => document.getElementById('stepIndicator'),
  };

  // ── CODE PANEL ────────────────────────────────────────────────

  function buildCodePanel(codeLines) {
    const container = el.codeLines();
    container.innerHTML = '';

    codeLines.forEach((line, i) => {
      const div = document.createElement('div');
      div.className = 'code-line';
      div.id = `codeLine${i}`;
      div.innerHTML = [
        '<div class="active-marker"></div>',
        `<span class="line-num">${i + 1}</span>`,
        `<span class="code-text">${line.html}</span>`,
      ].join('');
      container.appendChild(div);
    });
  }

  function setActiveLine(lineIdx) {
    document.querySelectorAll('.code-line').forEach((el, i) => {
      el.classList.remove('active');
      if (lineIdx !== null && i <= lineIdx) el.classList.add('executed');
    });

    if (lineIdx !== null) {
      const line = document.getElementById(`codeLine${lineIdx}`);
      if (line) {
        line.classList.add('active', 'executed');
      }
    }
  }

  // ── CALL STACK ────────────────────────────────────────────────

  function pushStack(label) {
    const frame = document.createElement('div');
    frame.className = 'stack-frame frame-stack';
    frame.textContent = label;
    frame.dataset.label = label;
    el.stackFrames().appendChild(frame);
  }

  function popStack(delay) {
    return new Promise(resolve => {
      setTimeout(() => {
        const container = el.stackFrames();
        const last = container.lastElementChild;
        if (last) {
          last.classList.add('popping');
          setTimeout(() => { last.remove(); resolve(); }, 300);
        } else {
          resolve();
        }
      }, delay);
    });
  }

  // ── MEMORY HEAP ───────────────────────────────────────────────

  function allocHeap(label) {
    const item = document.createElement('div');
    item.className = 'heap-item';
    item.textContent = label;
    el.heapItems().appendChild(item);
  }

  // ── WEB APIs ──────────────────────────────────────────────────

  function addWebApi(label, timer) {
    const item = document.createElement('div');
    item.className = 'webapi-item';
    item.dataset.label = label;
    item.innerHTML = `<span>${label}</span><span class="webapi-timer">${timer}</span>`;
    el.webapiItems().appendChild(item);
  }

  function removeWebApi(label) {
    const items = el.webapiItems().querySelectorAll('.webapi-item');
    items.forEach(item => {
      if (item.dataset.label === label) {
        item.style.opacity = '0';
        item.style.transform = 'translateX(15px)';
        item.style.transition = 'all 0.3s';
        setTimeout(() => item.remove(), 300);
      }
    });
  }

  // ── MICROTASK QUEUE ───────────────────────────────────────────

  function addMicroQueue(label) {
    const item = document.createElement('div');
    item.className = 'queue-item queue-item-micro';
    item.textContent = label;
    item.dataset.label = label;
    el.microItems().appendChild(item);
  }

  function dequeueMicro(label) {
    const items = el.microItems().querySelectorAll('.queue-item');
    items.forEach(item => {
      if (item.dataset.label === label) {
        item.classList.add('dequeuing');
        setTimeout(() => item.remove(), 350);
      }
    });
  }

  // ── TASK QUEUE ────────────────────────────────────────────────

  function addTaskQueue(label) {
    const item = document.createElement('div');
    item.className = 'queue-item queue-item-task';
    item.textContent = label;
    item.dataset.label = label;
    el.taskItems().appendChild(item);
  }

  function dequeueTask(label) {
    const items = el.taskItems().querySelectorAll('.queue-item');
    items.forEach(item => {
      if (item.dataset.label === label) {
        item.classList.add('dequeuing');
        setTimeout(() => item.remove(), 350);
      }
    });
  }

  // ── CONSOLE ───────────────────────────────────────────────────

  function consoleLog(text) {
    const line = document.createElement('div');
    line.className = 'console-line';
    line.innerHTML = `<span class="chevron">\u276F</span><span class="log-text">${text}</span>`;
    el.consoleLines().appendChild(line);
  }

  // ── EVENT LOOP ────────────────────────────────────────────────

  function setEventLoopState(state) {
    const ring   = el.loopRing();
    const label  = el.loopLabel();
    const status = el.loopStatus();

    if (state === 'checking') {
      ring.classList.add('spinning');
      label.textContent = '?';
      status.textContent = 'checking queues\u2026';
      status.classList.add('active');
    } else if (state === 'idle') {
      ring.classList.remove('spinning');
      label.textContent = 'idle';
      status.textContent = 'waiting for events';
      status.classList.remove('active');
    } else {
      ring.classList.remove('spinning');
      label.textContent = 'idle';
      status.textContent = '';
      status.classList.remove('active');
    }
  }

  // ── GLOW ──────────────────────────────────────────────────────

  function setGlow(boxIds) {
    document.querySelectorAll('.runtime-box').forEach(el => el.classList.remove('glow'));
    boxIds.forEach(id => {
      const box = document.getElementById(id);
      if (box) box.classList.add('glow');
    });
  }

  // ── NARRATION ─────────────────────────────────────────────────

  function setNarration(text, color, stepNum) {
    el.narrationText().innerHTML = text;
    const icon = el.narrationIcon();
    icon.style.borderColor = color || 'var(--border)';
    icon.style.color = color || 'var(--muted)';
    icon.textContent = stepNum != null ? String(stepNum) : '\u25B6';
  }

  // ── STEP INDICATOR ────────────────────────────────────────────

  function updateStepIndicator(currentStep, totalSteps) {
    const container = el.stepIndicator();
    container.innerHTML = '';

    for (let i = 0; i < totalSteps; i++) {
      const dot = document.createElement('div');
      dot.className = 'step-dot';
      if (i < currentStep) dot.classList.add('done');
      if (i === currentStep) dot.classList.add('current');
      container.appendChild(dot);
    }
  }

  // ── CLEAR ALL ─────────────────────────────────────────────────

  function clearAll() {
    el.stackFrames().innerHTML = '';
    el.heapItems().innerHTML = '';
    el.webapiItems().innerHTML = '';
    el.microItems().innerHTML = '';
    el.taskItems().innerHTML = '';
    el.consoleLines().innerHTML = '';

    document.querySelectorAll('.code-line').forEach(line => {
      line.classList.remove('active', 'executed');
    });

    setGlow([]);
    setEventLoopState('off');

    el.narrationText().innerHTML = 'Press <em>Play</em> to start the walkthrough. Each step shows how the JS runtime processes your code.';
    const icon = el.narrationIcon();
    icon.textContent = '\u25B6';
    icon.style.borderColor = 'var(--border)';
    icon.style.color = 'var(--muted)';
  }

  // ── PUBLIC API ────────────────────────────────────────────────

  return {
    buildCodePanel,
    setActiveLine,
    pushStack,
    popStack,
    allocHeap,
    addWebApi,
    removeWebApi,
    addMicroQueue,
    dequeueMicro,
    addTaskQueue,
    dequeueTask,
    consoleLog,
    setEventLoopState,
    setGlow,
    setNarration,
    updateStepIndicator,
    clearAll,
  };
})();
