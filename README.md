# JS Runtime Walkthrough

An interactive visualizer that shows how JavaScript code executes through the runtime. Pick a common interview question and watch it flow step-by-step through the call stack, event loop, task queues, and more.

## What It Does

Select from 30+ curated code examples and see exactly how JavaScript processes each line:

- **Call Stack** — function frames pushed and popped in real time
- **Memory Heap** — object allocations and closures
- **Web APIs** — timers, fetch requests, and other async APIs
- **Event Loop** — animated idle/checking states
- **Microtask Queue** — Promise callbacks, queueMicrotask
- **Task Queue** — setTimeout/setInterval callbacks
- **Console Output** — logs appear as they would at runtime
- **Narration** — plain-English explanations at every step

## Topics Covered

- **Event Loop** — setTimeout vs Promise ordering, zero-delay timers, nested callbacks
- **Promises** — chaining, microtask priority, Promise.all, async/await
- **Closures** — var vs let in loops, stale closure traps, IIFE patterns
- **Hoisting** — function declarations vs expressions, var/let/const behavior
- **Real World** — login flows, payment processing, analytics pipelines, debounce, retry logic

## Tech Stack

- **TypeScript** — strict mode, ES2022 target
- **Vite** — dev server with HMR, optimized production builds
- **Web Components** — Shadow DOM isolation, custom elements, no framework
- **Zero runtime dependencies** — vanilla browser APIs only

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |

## Project Structure

```
src/
├── main.ts                    # App controller and orchestrator
├── analyzer.ts                # Code parser and step generator
├── components/
│   ├── example-selector/      # Example picker with category filters
│   ├── code-panel/            # Syntax-highlighted source display
│   ├── call-stack/            # Call stack visualization
│   ├── memory-heap/           # Heap allocation display
│   ├── web-apis/              # Async Web API container
│   ├── event-loop/            # Animated event loop indicator
│   ├── microtask-queue/       # Microtask queue display
│   ├── task-queue/            # Macrotask queue display
│   ├── console-output/        # Console log output
│   ├── narration-bar/         # Step-by-step explanations
│   └── playback-controls/     # Play, step, reset, speed controls
└── css/
    ├── tokens.css             # Design tokens and color variables
    ├── base.css               # Layout grid and responsive rules
    └── shared.css             # Common utilities
```

## How It Works

1. **Select an example** — the `ExampleSelector` component dispatches a custom event with the code
2. **Analysis** — `analyzer.ts` parses the source, tokenizes it for syntax highlighting, classifies each statement, and generates an ordered list of animation steps
3. **Playback** — `main.ts` iterates through steps, executing actions (push/pop stack, queue callbacks, log output) with timed delays and narration
4. **Visualization** — each Web Component updates its Shadow DOM in response to actions, with glow effects highlighting the active runtime region

The analyzer handles the full event loop simulation: synchronous code runs first, then all microtasks drain before any macrotask executes, matching real browser behavior.
