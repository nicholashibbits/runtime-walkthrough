/* ================================================================
   App Controller (ES Module)
   ─────────────────────────────────────────────────────────────────
   Orchestrates the example selector, code analysis, and animation
   playback. Wires up all component events and manages playback state.
   ================================================================ */

// Global CSS
import './css/tokens.css';
import './css/base.css';
import './css/shared.css';

// Analyzer
import { analyze } from './analyzer.ts';

// Components (side-effect imports — each self-registers)
import './components/example-selector/example-selector.ts';
import './components/code-panel/code-panel.ts';
import './components/call-stack/call-stack.ts';
import './components/memory-heap/memory-heap.ts';
import './components/web-apis/web-apis.ts';
import './components/event-loop/event-loop.ts';
import './components/microtask-queue/microtask-queue.ts';
import './components/task-queue/task-queue.ts';
import './components/console-output/console-output.ts';
import './components/narration-bar/narration-bar.ts';
import './components/playback-controls/playback-controls.ts';

// Type-only imports for custom elements
import type { ExampleSelector } from './components/example-selector/example-selector.ts';
import type { CodePanel } from './components/code-panel/code-panel.ts';
import type { CallStack } from './components/call-stack/call-stack.ts';
import type { MemoryHeap } from './components/memory-heap/memory-heap.ts';
import type { WebApis } from './components/web-apis/web-apis.ts';
import type { EventLoop } from './components/event-loop/event-loop.ts';
import type { MicrotaskQueue } from './components/microtask-queue/microtask-queue.ts';
import type { TaskQueue } from './components/task-queue/task-queue.ts';
import type { ConsoleOutput } from './components/console-output/console-output.ts';
import type { NarrationBar } from './components/narration-bar/narration-bar.ts';
import type { PlaybackControls } from './components/playback-controls/playback-controls.ts';

// ── STATE ─────────────────────────────────────────────────────

let steps: any[] = [];
let currentStep = -1;
let isPlaying = false;
let speed = 1;
let animationTimeout: ReturnType<typeof setTimeout> | null = null;

// ── DOM REFERENCES ────────────────────────────────────────────

const selector  = document.querySelector('example-selector') as ExampleSelector;
const codePanel = document.querySelector('code-panel') as CodePanel;
const stack     = document.querySelector('call-stack') as CallStack;
const heap      = document.querySelector('memory-heap') as MemoryHeap;
const webApis   = document.querySelector('web-apis') as WebApis;
const eventLoop = document.querySelector('event-loop') as EventLoop;
const microQ    = document.querySelector('microtask-queue') as MicrotaskQueue;
const taskQ     = document.querySelector('task-queue') as TaskQueue;
const consoleEl = document.querySelector('console-output') as ConsoleOutput;
const narration = document.querySelector('narration-bar') as NarrationBar;
const controls  = document.querySelector('playback-controls') as PlaybackControls;

const inputView = document.getElementById('inputView')!;
const vizView   = document.getElementById('vizView')!;

// ── GLOW MAP ──────────────────────────────────────────────────

interface GlowableComponent {
  setGlow(on: boolean): void;
}

const glowMap: Record<string, GlowableComponent> = {
  boxStack: stack,
  boxHeap: heap,
  boxWebapi: webApis,
  boxEventloop: eventLoop,
  boxMicro: microQ,
  boxTask: taskQ,
  boxConsole: consoleEl,
};

// ── TIMING ────────────────────────────────────────────────────

function getDelay(ms: number) {
  return ms / speed;
}

function sleep(ms: number) {
  return new Promise<void>(resolve => {
    animationTimeout = setTimeout(resolve, ms);
  });
}

// ── VIEW SWITCHING ────────────────────────────────────────────

function showInput() {
  inputView.style.display = '';
  vizView.style.display = 'none';
}

function showViz() {
  inputView.style.display = 'none';
  vizView.style.display = '';
}

// ── GLOW ──────────────────────────────────────────────────────

function setGlow(boxIds: string[]) {
  Object.values(glowMap).forEach(comp => comp.setGlow(false));
  boxIds.forEach(id => {
    if (glowMap[id]) glowMap[id].setGlow(true);
  });
}

// ── CLEAR ALL ─────────────────────────────────────────────────

function clearAllViz() {
  stack.clear();
  heap.clear();
  webApis.clear();
  microQ.clear();
  taskQ.clear();
  consoleEl.clear();
  codePanel.clearHighlights();
  eventLoop.setState('off');
  narration.reset();
  setGlow([]);
}

// ── EXECUTE A SINGLE STEP ─────────────────────────────────────

async function executeStep(stepIdx: number) {
  const step = steps[stepIdx];
  if (!step) return;

  currentStep = stepIdx;
  controls.updateStepIndicator(currentStep, steps.length);

  // Highlight code line
  if (step.line !== null) {
    codePanel.setActiveLine(step.line);
  }

  // Set glow on relevant boxes
  setGlow(step.glow || []);

  // Set narration
  narration.setNarration(step.narration, step.narrateColor, currentStep + 1);

  // Execute actions sequentially
  for (const action of step.actions) {
    switch (action.type) {
      case 'pushStack':
        stack.pushStack(action.label);
        await sleep(getDelay(300));
        break;

      case 'popStack':
        await stack.popStack(getDelay(action.delay || 0));
        await sleep(getDelay(200));
        break;

      case 'allocHeap':
        heap.allocHeap(action.label);
        await sleep(getDelay(300));
        break;

      case 'addWebApi':
        webApis.addWebApi(action.label, action.timer);
        await sleep(getDelay(300));
        break;

      case 'removeWebApi':
        webApis.removeWebApi(action.label);
        await sleep(getDelay(400));
        break;

      case 'addMicroQueue':
        microQ.addItem(action.label);
        await sleep(getDelay(300));
        break;

      case 'addTaskQueue':
        taskQ.addItem(action.label);
        await sleep(getDelay(300));
        break;

      case 'dequeueMicro':
        microQ.dequeueItem(action.label);
        await sleep(getDelay(400));
        break;

      case 'dequeueTask':
        taskQ.dequeueItem(action.label);
        await sleep(getDelay(400));
        break;

      case 'consoleLog':
        consoleEl.log(action.text);
        await sleep(getDelay(200));
        break;

      case 'eventLoopCheck':
        eventLoop.setState('checking');
        await sleep(getDelay(700));
        break;

      case 'eventLoopIdle':
        eventLoop.setState('idle');
        await sleep(getDelay(300));
        break;
    }
  }
}

// ── PLAYBACK CONTROLS ─────────────────────────────────────────

async function startAnimation() {
  if (isPlaying) return;
  isPlaying = true;
  controls.setPlaying(true);

  const startFrom = currentStep < 0 ? 0 : currentStep + 1;

  for (let i = startFrom; i < steps.length; i++) {
    if (!isPlaying) break;
    await executeStep(i);
    if (i < steps.length - 1) await sleep(getDelay(1200));
  }

  isPlaying = false;
  controls.setPlaying(false);
}

async function stepForward() {
  if (isPlaying) {
    isPlaying = false;
    if (animationTimeout) clearTimeout(animationTimeout);
    controls.setPlaying(false);
    await sleep(100);
  }

  const next = currentStep + 1;
  if (next < steps.length) {
    await executeStep(next);
  }
}

function resetAnimation() {
  isPlaying = false;
  if (animationTimeout) clearTimeout(animationTimeout);
  currentStep = -1;

  controls.setPlaying(false);
  clearAllViz();
  controls.updateStepIndicator(-1, steps.length);
}

// ── EVENT WIRING ──────────────────────────────────────────────

selector.addEventListener('example-selected', (e) => {
  const { code, title } = (e as CustomEvent).detail;
  const result = analyze(code);
  steps = result.steps;
  currentStep = -1;
  isPlaying = false;

  codePanel.buildCodePanel(result.codeLines);
  codePanel.setFilename(title);
  clearAllViz();
  controls.updateStepIndicator(-1, steps.length);
  controls.setPlaying(false);
  showViz();
});

codePanel.addEventListener('edit-requested', () => {
  isPlaying = false;
  if (animationTimeout) clearTimeout(animationTimeout);
  showInput();
});

controls.addEventListener('play-requested', () => startAnimation());
controls.addEventListener('step-requested', () => stepForward());
controls.addEventListener('reset-requested', () => resetAnimation());
controls.addEventListener('speed-changed', (e) => {
  speed = (e as CustomEvent).detail.speed;
});
