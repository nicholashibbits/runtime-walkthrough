/* ================================================================
   App Controller
   ─────────────────────────────────────────────────────────────────
   Orchestrates the input view, code analysis, and animation
   playback. Wires up all UI controls and manages playback state.

   Self-initialises on DOMContentLoaded.
   ================================================================ */

const App = (() => {

  // ── PRESET CODE EXAMPLES ──────────────────────────────────────

  const PRESETS = {
    basic: [
      '// A simple script touching every runtime part',
      '',
      'const user = { name: "Alice" };',
      '',
      'console.log("1: start");',
      '',
      'setTimeout(() => {',
      '  console.log("4: timeout");',
      '}, 0);',
      '',
      'Promise.resolve()',
      '  .then(() => console.log("3: microtask"));',
      '',
      'console.log("2: end");',
    ].join('\n'),

    async: [
      'console.log("start");',
      '',
      'setTimeout(() => {',
      '  console.log("timeout 1");',
      '}, 1000);',
      '',
      'setTimeout(() => {',
      '  console.log("timeout 2");',
      '}, 0);',
      '',
      'Promise.resolve()',
      '  .then(() => console.log("micro 1"));',
      '',
      'queueMicrotask(() => console.log("micro 2"));',
      '',
      'console.log("end");',
    ].join('\n'),

    promises: [
      'const data = { id: 1, name: "Bob" };',
      '',
      'console.log("script start");',
      '',
      'Promise.resolve()',
      '  .then(() => console.log("promise 1"));',
      '',
      'Promise.resolve()',
      '  .then(() => console.log("promise 2"));',
      '',
      'setTimeout(() => {',
      '  console.log("setTimeout");',
      '}, 0);',
      '',
      'console.log("script end");',
    ].join('\n'),
  };

  // ── STATE ─────────────────────────────────────────────────────

  let steps = [];
  let currentStep = -1;
  let isPlaying = false;
  let speed = 1;
  let animationTimeout = null;

  // ── DOM REFERENCES ────────────────────────────────────────────

  const $ = id => document.getElementById(id);

  // ── TIMING ────────────────────────────────────────────────────

  function getDelay(ms) {
    return ms / speed;
  }

  function sleep(ms) {
    return new Promise(resolve => {
      animationTimeout = setTimeout(resolve, ms);
    });
  }

  // ── VIEW SWITCHING ────────────────────────────────────────────

  function showInput() {
    $('inputView').style.display = '';
    $('vizView').style.display = 'none';
  }

  function showViz() {
    $('inputView').style.display = 'none';
    $('vizView').style.display = '';
  }

  // ── LINE COUNT ────────────────────────────────────────────────

  function updateLineCount() {
    const textarea = $('codeInput');
    const count = textarea.value.split('\n').length;
    const el = $('lineCount');
    el.textContent = `${count} / 50 lines`;
    el.classList.toggle('over-limit', count > 50);
  }

  // ── LOAD CODE ─────────────────────────────────────────────────

  function loadCode() {
    const code = $('codeInput').value.trim();
    if (!code) return;

    const lineCount = code.split('\n').length;
    if (lineCount > 50) {
      alert('Please limit your code to 50 lines or fewer.');
      return;
    }

    // Analyze
    const result = CodeAnalyzer.analyze(code);
    steps = result.steps;
    currentStep = -1;
    isPlaying = false;

    // Build the code panel
    RuntimeViz.buildCodePanel(result.codeLines);
    RuntimeViz.clearAll();
    RuntimeViz.updateStepIndicator(-1, steps.length);

    // Switch to viz
    showViz();
    updatePlayButton();
  }

  // ── EXECUTE A SINGLE STEP ─────────────────────────────────────

  async function executeStep(stepIdx) {
    const step = steps[stepIdx];
    if (!step) return;

    currentStep = stepIdx;
    RuntimeViz.updateStepIndicator(currentStep, steps.length);

    // Highlight code line
    if (step.line !== null) {
      RuntimeViz.setActiveLine(step.line);
    }

    // Set glow on relevant boxes
    RuntimeViz.setGlow(step.glow || []);

    // Set narration
    RuntimeViz.setNarration(step.narration, step.narrateColor, currentStep + 1);

    // Execute actions sequentially
    for (const action of step.actions) {
      switch (action.type) {
        case 'pushStack':
          RuntimeViz.pushStack(action.label);
          await sleep(getDelay(300));
          break;

        case 'popStack':
          await RuntimeViz.popStack(getDelay(action.delay || 0));
          await sleep(getDelay(200));
          break;

        case 'allocHeap':
          RuntimeViz.allocHeap(action.label);
          await sleep(getDelay(300));
          break;

        case 'addWebApi':
          RuntimeViz.addWebApi(action.label, action.timer);
          await sleep(getDelay(300));
          break;

        case 'removeWebApi':
          RuntimeViz.removeWebApi(action.label);
          await sleep(getDelay(400));
          break;

        case 'addMicroQueue':
          RuntimeViz.addMicroQueue(action.label);
          await sleep(getDelay(300));
          break;

        case 'addTaskQueue':
          RuntimeViz.addTaskQueue(action.label);
          await sleep(getDelay(300));
          break;

        case 'dequeueMicro':
          RuntimeViz.dequeueMicro(action.label);
          await sleep(getDelay(400));
          break;

        case 'dequeueTask':
          RuntimeViz.dequeueTask(action.label);
          await sleep(getDelay(400));
          break;

        case 'consoleLog':
          RuntimeViz.consoleLog(action.text);
          await sleep(getDelay(200));
          break;

        case 'eventLoopCheck':
          RuntimeViz.setEventLoopState('checking');
          await sleep(getDelay(700));
          break;

        case 'eventLoopIdle':
          RuntimeViz.setEventLoopState('idle');
          await sleep(getDelay(300));
          break;
      }
    }
  }

  // ── PLAYBACK CONTROLS ─────────────────────────────────────────

  function updatePlayButton() {
    const btn = $('btnPlay');
    if (isPlaying) {
      btn.disabled = true;
      btn.textContent = '\u23F8 Playing';
    } else {
      btn.disabled = false;
      btn.textContent = '\u25B6 Play';
    }
  }

  async function startAnimation() {
    if (isPlaying) return;
    isPlaying = true;
    updatePlayButton();

    const startFrom = currentStep < 0 ? 0 : currentStep + 1;

    for (let i = startFrom; i < steps.length; i++) {
      if (!isPlaying) break;
      await executeStep(i);
      if (i < steps.length - 1) await sleep(getDelay(1200));
    }

    isPlaying = false;
    updatePlayButton();
  }

  async function stepForward() {
    if (isPlaying) {
      isPlaying = false;
      clearTimeout(animationTimeout);
      updatePlayButton();
      await sleep(100);
    }

    const next = currentStep + 1;
    if (next < steps.length) {
      await executeStep(next);
    }
  }

  function resetAnimation() {
    isPlaying = false;
    clearTimeout(animationTimeout);
    currentStep = -1;

    updatePlayButton();
    RuntimeViz.clearAll();
    RuntimeViz.updateStepIndicator(-1, steps.length);
  }

  function setSpeed(s) {
    speed = s;
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.classList.toggle('active', Number(btn.dataset.speed) === s);
    });
  }

  // ── INITIALISATION ────────────────────────────────────────────

  function init() {
    // ─ Input view listeners ─

    $('codeInput').addEventListener('input', updateLineCount);

    $('btnLoad').addEventListener('click', loadCode);

    // Preset buttons
    document.querySelectorAll('[data-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.preset;
        if (PRESETS[key]) {
          $('codeInput').value = PRESETS[key];
          updateLineCount();
        }
      });
    });

    // ─ Viz view listeners ─

    $('btnEdit').addEventListener('click', () => {
      isPlaying = false;
      clearTimeout(animationTimeout);
      showInput();
    });

    $('btnPlay').addEventListener('click', startAnimation);
    $('btnStep').addEventListener('click', stepForward);
    $('btnReset').addEventListener('click', resetAnimation);

    // Speed buttons
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setSpeed(Number(btn.dataset.speed));
      });
    });

    // Tab key support in textarea
    $('codeInput').addEventListener('keydown', e => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const ta = e.target;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        ta.value = ta.value.substring(0, start) + '  ' + ta.value.substring(end);
        ta.selectionStart = ta.selectionEnd = start + 2;
        updateLineCount();
      }
    });

    // Initial line count
    updateLineCount();

    // Load the basic preset by default
    $('codeInput').value = PRESETS.basic;
    updateLineCount();
  }

  // ── BOOT ──────────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ── PUBLIC (for debugging) ────────────────────────────────────

  return { loadCode, startAnimation, stepForward, resetAnimation, setSpeed };
})();
