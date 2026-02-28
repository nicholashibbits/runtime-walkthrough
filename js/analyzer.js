/* ================================================================
   CodeAnalyzer
   ─────────────────────────────────────────────────────────────────
   Parses raw JavaScript text and produces two things:
     1. codeLines  – syntax-highlighted HTML for the code panel
     2. steps      – animation step objects for the runtime viz

   Exposed as a single global:  CodeAnalyzer.analyze(code)
   ================================================================ */

const CodeAnalyzer = (() => {

  // ── TOKEN SETS ────────────────────────────────────────────────

  const KEYWORDS = new Set([
    'const', 'let', 'var', 'function', 'return', 'if', 'else',
    'for', 'while', 'do', 'switch', 'case', 'break', 'continue',
    'new', 'typeof', 'instanceof', 'class', 'extends', 'import',
    'export', 'default', 'async', 'await', 'try', 'catch',
    'finally', 'throw', 'true', 'false', 'null', 'undefined',
    'this', 'of', 'in', 'yield', 'delete', 'void',
  ]);

  const BUILTINS = new Set([
    'console', 'log', 'warn', 'error', 'info', 'debug', 'table',
    'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
    'Promise', 'resolve', 'reject', 'then', 'catch', 'finally',
    'fetch', 'JSON', 'parse', 'stringify',
    'Array', 'Object', 'Map', 'Set', 'Math', 'Date', 'String',
    'Number', 'Boolean', 'RegExp', 'Symbol', 'Error',
    'parseInt', 'parseFloat', 'isNaN', 'isFinite',
    'addEventListener', 'removeEventListener',
    'document', 'window', 'alert', 'prompt',
    'queueMicrotask', 'requestAnimationFrame',
  ]);

  // ── HTML HELPERS ──────────────────────────────────────────────

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ── SYNTAX HIGHLIGHTER ────────────────────────────────────────

  function highlightSyntax(text) {
    if (!text.trim()) return '&nbsp;';

    const out = [];
    let i = 0;

    while (i < text.length) {
      const ch = text[i];

      // ─ Strings ─
      if (ch === '"' || ch === "'" || ch === '`') {
        let j = i + 1;
        while (j < text.length && text[j] !== ch) {
          if (text[j] === '\\') j++;
          j++;
        }
        if (j < text.length) j++;
        out.push(`<span class="str">${esc(text.slice(i, j))}</span>`);
        i = j;
        continue;
      }

      // ─ Single-line comment ─
      if (ch === '/' && text[i + 1] === '/') {
        out.push(`<span class="cm">${esc(text.slice(i))}</span>`);
        break;
      }

      // ─ Numbers ─
      if (/\d/.test(ch) && (i === 0 || !/[\w$]/.test(text[i - 1]))) {
        let j = i;
        while (j < text.length && /[\d.]/.test(text[j])) j++;
        out.push(`<span class="num">${esc(text.slice(i, j))}</span>`);
        i = j;
        continue;
      }

      // ─ Identifiers & keywords ─
      if (/[a-zA-Z_$]/.test(ch)) {
        let j = i;
        while (j < text.length && /[\w$]/.test(text[j])) j++;
        const word = text.slice(i, j);
        if (KEYWORDS.has(word))       out.push(`<span class="kw">${word}</span>`);
        else if (BUILTINS.has(word))  out.push(`<span class="fn">${word}</span>`);
        else                          out.push(esc(word));
        i = j;
        continue;
      }

      // ─ Arrow ─
      if (ch === '=' && text[i + 1] === '>') {
        out.push('<span class="op">=&gt;</span>');
        i += 2;
        continue;
      }

      // ─ Default character ─
      out.push(esc(ch));
      i++;
    }

    return out.join('');
  }

  // ── DELIMITER COUNTING (ignores strings) ──────────────────────

  function countDelimiters(line) {
    let parens = 0;
    let braces = 0;
    let inStr = null;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inStr) {
        if (ch === '\\') { i++; continue; }
        if (ch === inStr) inStr = null;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
      if (ch === '/' && line[i + 1] === '/') break; // rest is comment
      if (ch === '(') parens++;
      if (ch === ')') parens--;
      if (ch === '{') braces++;
      if (ch === '}') braces--;
    }

    return { parens, braces };
  }

  // ── GROUP LINES INTO STATEMENTS ───────────────────────────────

  function groupStatements(lines) {
    const stmts = [];
    let current = null;
    let parenDepth = 0;
    let braceDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();

      // Standalone blank or comment → own statement
      if (!current && (trimmed === '' || trimmed.startsWith('//'))) {
        stmts.push({
          startLine: i,
          endLine: i,
          lines: [lines[i]],
          fullText: lines[i],
        });
        continue;
      }

      if (!current) {
        current = { startLine: i, lines: [lines[i]] };
        parenDepth = 0;
        braceDepth = 0;
      } else {
        current.lines.push(lines[i]);
      }

      const d = countDelimiters(lines[i]);
      parenDepth += d.parens;
      braceDepth += d.braces;

      if (parenDepth <= 0 && braceDepth <= 0) {
        current.endLine = i;
        current.fullText = current.lines.join('\n');
        stmts.push(current);
        current = null;
        parenDepth = 0;
        braceDepth = 0;
      }
    }

    if (current) {
      current.endLine = lines.length - 1;
      current.fullText = current.lines.join('\n');
      stmts.push(current);
    }

    return stmts;
  }

  // ── EXTRACT HELPERS ───────────────────────────────────────────

  function extractStringLiteral(s) {
    const m = s.match(/^(['"`])([\s\S]*)\1$/);
    return m ? m[2] : s;
  }

  function extractConsoleArg(fullText) {
    const m = fullText.match(/console\.\w+\s*\(\s*([\s\S]*?)\s*\)\s*;?\s*$/);
    if (!m) return fullText;
    return extractStringLiteral(m[1].split(',')[0].trim());
  }

  function extractConsoleMethod(fullText) {
    const m = fullText.match(/console\.(\w+)/);
    return m ? m[1] : 'log';
  }

  function extractTimerDelay(fullText) {
    const m = fullText.match(/,\s*(\d+)\s*\)\s*;?\s*$/);
    return m ? m[1] : '0';
  }

  function extractVarParts(firstLine) {
    const m = firstLine.match(/^\s*(const|let|var)\s+(\w+)\s*=\s*([\s\S]*?)$/);
    if (!m) return null;
    let value = m[3].replace(/;?\s*$/, '').trim();
    return { keyword: m[1], name: m[2], value };
  }

  function extractFuncName(text) {
    const m = text.match(/function\s+(\w+)/);
    return m ? m[1] : null;
  }

  function extractCallName(text) {
    const m = text.trim().match(/^(\w+(?:\.\w+)*)\s*\(/);
    return m ? m[1] : null;
  }

  // ── CLASSIFY A GROUPED STATEMENT ──────────────────────────────

  function classify(stmt) {
    const first = stmt.lines[0].trim();
    const full  = stmt.fullText.trim();

    // Empty / comment
    if (full === '' || first === '')       return { ...stmt, type: 'empty' };
    if (first.startsWith('//'))            return { ...stmt, type: 'comment' };

    // ── ASYNC PATTERNS ──

    // setTimeout / setInterval
    if (/setTimeout\s*\(/.test(first) || /^\s*(const|let|var)\s+\w+\s*=\s*setTimeout/.test(first)) {
      const delay = extractTimerDelay(full);
      const callbackLines = stmt.lines.length > 1
        ? stmt.lines.slice(1, -1).map((l, idx) => ({ index: stmt.startLine + 1 + idx, text: l }))
        : [];
      // For single-line, try to extract inline callback expression
      let inlineExpr = null;
      if (stmt.lines.length === 1) {
        const m = full.match(/setTimeout\s*\(\s*\(\s*\)\s*=>\s*(.*?)\s*,/);
        if (m) inlineExpr = m[1].replace(/;$/, '');
      }
      return { ...stmt, type: 'setTimeout', delay, callbackLines, inlineExpr };
    }

    if (/setInterval\s*\(/.test(first)) {
      const delay = extractTimerDelay(full);
      return { ...stmt, type: 'setInterval', delay, callbackLines: [], inlineExpr: null };
    }

    // Promise.resolve().then(...)
    if (/Promise\.resolve\s*\(/.test(full) && /\.then\s*\(/.test(full)) {
      const callbackLines = stmt.lines.length > 1
        ? stmt.lines.slice(1, -1).filter(l => !l.trim().startsWith('.')).map((l, idx) => ({ index: stmt.startLine + 1 + idx, text: l }))
        : [];
      let inlineExpr = null;
      if (stmt.lines.length <= 2) {
        const m = full.match(/\.then\s*\(\s*\(\s*\)\s*=>\s*(.*?)\s*\)\s*;?\s*$/);
        if (!m) {
          const m2 = full.match(/\.then\s*\(\s*\(\s*\)\s*=>\s*\{?\s*([\s\S]*?)\s*\}?\s*\)\s*;?\s*$/);
          if (m2) inlineExpr = m2[1].replace(/;$/, '').trim();
        } else {
          inlineExpr = m[1].replace(/;$/, '').trim();
        }
      }
      return { ...stmt, type: 'promiseThen', callbackLines, inlineExpr };
    }

    // new Promise(...)
    if (/new\s+Promise\s*\(/.test(first)) {
      return { ...stmt, type: 'newPromise' };
    }

    // .then() chain (standalone)
    if (/^\s*\.then\s*\(/.test(first)) {
      let inlineExpr = null;
      const m = full.match(/\.then\s*\(\s*(?:\(\s*\w*\s*\)|(\w+))\s*=>\s*(.*?)\s*\)\s*;?\s*$/);
      if (m) inlineExpr = m[2].replace(/;$/, '').trim();
      const callbackLines = stmt.lines.length > 1
        ? stmt.lines.slice(1, -1).map((l, idx) => ({ index: stmt.startLine + 1 + idx, text: l }))
        : [];
      return { ...stmt, type: 'thenChain', callbackLines, inlineExpr };
    }

    // fetch(...)
    if (/fetch\s*\(/.test(first)) {
      return { ...stmt, type: 'fetch' };
    }

    // queueMicrotask(...)
    if (/queueMicrotask\s*\(/.test(first)) {
      let inlineExpr = null;
      if (stmt.lines.length === 1) {
        const m = full.match(/queueMicrotask\s*\(\s*\(\s*\)\s*=>\s*(.*?)\s*\)\s*;?\s*$/);
        if (m) inlineExpr = m[1].replace(/;$/, '');
      }
      const callbackLines = stmt.lines.length > 1
        ? stmt.lines.slice(1, -1).map((l, idx) => ({ index: stmt.startLine + 1 + idx, text: l }))
        : [];
      return { ...stmt, type: 'queueMicrotask', callbackLines, inlineExpr };
    }

    // ── CONSOLE ──
    if (/console\.(log|warn|error|info|debug|table)\s*\(/.test(first)) {
      return {
        ...stmt,
        type: 'console',
        method: extractConsoleMethod(full),
        arg: extractConsoleArg(full),
      };
    }

    // ── VARIABLE DECLARATIONS ──

    if (/^\s*(const|let|var)\s+/.test(first)) {
      const parts = extractVarParts(first);
      if (!parts) return { ...stmt, type: 'varPrimitive', name: '?', value: '' };

      // Object or array literal
      if (/^[\{\[]/.test(parts.value)) {
        return { ...stmt, type: 'varObject', ...parts };
      }
      // Function expression or arrow
      if (/^(async\s+)?function/.test(parts.value) || /=>/.test(full)) {
        return { ...stmt, type: 'varFunction', ...parts };
      }
      // new Something
      if (/^new\s+/.test(parts.value)) {
        return { ...stmt, type: 'varObject', ...parts };
      }
      // Primitive
      return { ...stmt, type: 'varPrimitive', ...parts };
    }

    // ── FUNCTION DECLARATIONS ──
    if (/^\s*(async\s+)?function\s+\w+/.test(first)) {
      return { ...stmt, type: 'funcDecl', name: extractFuncName(first) };
    }

    // ── CLASS DECLARATIONS ──
    if (/^\s*class\s+/.test(first)) {
      const m = first.match(/class\s+(\w+)/);
      return { ...stmt, type: 'classDecl', name: m ? m[1] : '?' };
    }

    // ── CONTROL FLOW ──
    if (/^\s*if\s*\(/.test(first))      return { ...stmt, type: 'if' };
    if (/^\s*else\s/.test(first))       return { ...stmt, type: 'else' };
    if (/^\s*for\s*\(/.test(first))     return { ...stmt, type: 'for' };
    if (/^\s*while\s*\(/.test(first))   return { ...stmt, type: 'while' };
    if (/^\s*switch\s*\(/.test(first))  return { ...stmt, type: 'switch' };
    if (/^\s*try\s*\{?/.test(first))    return { ...stmt, type: 'try' };
    if (/^\s*catch\s*\(/.test(first))   return { ...stmt, type: 'catch' };

    // ── RETURN ──
    if (/^\s*return\b/.test(first))     return { ...stmt, type: 'return' };

    // ── BLOCK CLOSE ──
    if (/^\s*\}/.test(first))           return { ...stmt, type: 'blockClose' };

    // ── AWAIT ──
    if (/await\s+/.test(first))         return { ...stmt, type: 'await' };

    // ── GENERIC FUNCTION CALL ──
    if (/\w+\s*\(/.test(first)) {
      return { ...stmt, type: 'funcCall', name: extractCallName(first) };
    }

    // ── ASSIGNMENT ──
    if (/^\s*\w+(\.\w+)*\s*(=|\+=|-=|\*=)/.test(first)) {
      return { ...stmt, type: 'assignment' };
    }

    // ── FALLBACK ──
    return { ...stmt, type: 'expression' };
  }

  // ── ANALYZE CALLBACK BODY ─────────────────────────────────────
  // Returns extra actions[] for lines inside a deferred callback.

  function analyzeCallbackBody(cbLines, inlineExpr) {
    const actions = [];

    // If there's a single inline expression, handle it
    if (inlineExpr) {
      if (/console\.\w+\s*\(/.test(inlineExpr)) {
        const arg = extractConsoleArg(inlineExpr);
        actions.push({ type: 'pushStack', label: truncate(inlineExpr, 30) });
        actions.push({ type: 'consoleLog', text: arg });
        actions.push({ type: 'popStack', delay: 200 });
      }
      return actions;
    }

    // Multi-line callback body
    for (const cl of cbLines) {
      const trimmed = cl.text.trim();
      if (!trimmed || trimmed.startsWith('//')) continue;

      if (/console\.\w+\s*\(/.test(trimmed)) {
        const arg = extractConsoleArg(trimmed);
        actions.push({ type: 'pushStack', label: truncate(trimmed, 30) });
        actions.push({ type: 'consoleLog', text: arg });
        actions.push({ type: 'popStack', delay: 200 });
      } else {
        // Generic line execution within callback
        actions.push({ type: 'pushStack', label: truncate(trimmed, 30) });
        actions.push({ type: 'popStack', delay: 150 });
      }
    }

    return actions;
  }

  function truncate(s, max) {
    s = s.replace(/;$/, '').trim();
    return s.length > max ? s.slice(0, max - 1) + '\u2026' : s;
  }

  // ── STEP GENERATION ───────────────────────────────────────────

  function generateSteps(classified, totalLines) {
    const steps = [];
    const microtasks = [];  // callbacks deferred to microtask queue
    const macrotasks = [];  // callbacks deferred to task queue

    // ── Step: push global execution context ──
    steps.push({
      line: classified.find(s => s.type !== 'empty' && s.type !== 'comment')?.startLine ?? 0,
      actions: [{ type: 'pushStack', label: '<global>' }],
      glow: ['boxStack'],
      narrateColor: 'var(--stack)',
      narration: 'The engine begins executing your script. The <em style="color:var(--stack)">global execution context</em> is pushed onto the call stack.',
    });

    // ── Walk through each statement ──
    for (const stmt of classified) {
      if (stmt.type === 'empty' || stmt.type === 'comment' || stmt.type === 'blockClose') continue;

      const lineNum = stmt.startLine + 1; // 1-indexed for narration

      switch (stmt.type) {

        // ── console.log / warn / error ──
        case 'console': {
          steps.push({
            line: stmt.startLine,
            actions: [
              { type: 'pushStack', label: truncate(stmt.fullText.trim(), 32) },
              { type: 'consoleLog', text: stmt.arg },
              { type: 'popStack', delay: 400 },
            ],
            glow: ['boxStack', 'boxConsole'],
            narrateColor: 'var(--stack)',
            narration: `<em style="color:var(--stack)">Line ${lineNum}</em> \u2014 <code>console.${stmt.method}</code> is pushed onto the call stack, executes synchronously, prints to the console, and pops off immediately.`,
          });
          break;
        }

        // ── setTimeout ──
        case 'setTimeout': {
          const label = `setTimeout(cb, ${stmt.delay})`;
          const queueLabel = 'cb: setTimeout';

          // Step: register with Web API
          steps.push({
            line: stmt.startLine,
            actions: [
              { type: 'pushStack', label },
              { type: 'addWebApi', label: 'setTimeout', timer: `${stmt.delay}ms` },
              { type: 'popStack', delay: 300 },
            ],
            glow: ['boxStack', 'boxWebapi'],
            narrateColor: 'var(--webapi)',
            narration: `<em style="color:var(--stack)">Line ${lineNum}</em> \u2014 <code>setTimeout</code> is pushed onto the stack, but the timer is <em style="color:var(--webapi)">handed off to the Web API</em>. The engine doesn\u2019t wait \u2014 it pops the frame and continues.`,
          });

          // Step: timer fires → task queue
          steps.push({
            line: stmt.startLine,
            actions: [
              { type: 'removeWebApi', label: 'setTimeout' },
              { type: 'addTaskQueue', label: queueLabel },
            ],
            glow: ['boxWebapi', 'boxTask'],
            narrateColor: 'var(--taskq)',
            narration: `The <em style="color:var(--webapi)">Web API</em> timer (${stmt.delay}ms) completes. The callback is moved into the <em style="color:var(--taskq)">Task Queue</em> (macrotask queue). It won\u2019t run until the stack is empty and all microtasks are drained.`,
          });

          macrotasks.push({ stmt, queueLabel });
          break;
        }

        // ── setInterval ──
        case 'setInterval': {
          steps.push({
            line: stmt.startLine,
            actions: [
              { type: 'pushStack', label: `setInterval(cb, ${stmt.delay})` },
              { type: 'addWebApi', label: 'setInterval', timer: `${stmt.delay}ms` },
              { type: 'popStack', delay: 300 },
            ],
            glow: ['boxStack', 'boxWebapi'],
            narrateColor: 'var(--webapi)',
            narration: `<em style="color:var(--stack)">Line ${lineNum}</em> \u2014 <code>setInterval</code> registers a recurring timer with the <em style="color:var(--webapi)">Web API</em>. Each interval fires a callback into the task queue.`,
          });
          break;
        }

        // ── Promise.resolve().then(...) ──
        case 'promiseThen': {
          const queueLabel = '.then(cb)';

          steps.push({
            line: stmt.startLine,
            actions: [
              { type: 'pushStack', label: 'Promise.resolve()' },
              { type: 'addMicroQueue', label: queueLabel },
              { type: 'popStack', delay: 300 },
            ],
            glow: ['boxStack', 'boxMicro'],
            narrateColor: 'var(--microtask)',
            narration: `<em style="color:var(--stack)">Line ${lineNum}</em> \u2014 <code>Promise.resolve()</code> runs synchronously. The <code>.then</code> callback is placed directly in the <em style="color:var(--microtask)">Microtask Queue</em> \u2014 no Web API needed for already-resolved promises.`,
          });

          microtasks.push({ stmt, queueLabel });
          break;
        }

        // ── .then() chain (standalone) ──
        case 'thenChain': {
          const queueLabel = '.then(cb)';

          steps.push({
            line: stmt.startLine,
            actions: [
              { type: 'addMicroQueue', label: queueLabel },
            ],
            glow: ['boxMicro'],
            narrateColor: 'var(--microtask)',
            narration: `<em style="color:var(--stack)">Line ${lineNum}</em> \u2014 The <code>.then</code> callback is queued in the <em style="color:var(--microtask)">Microtask Queue</em>. It will run after the current synchronous code finishes.`,
          });

          microtasks.push({ stmt, queueLabel });
          break;
        }

        // ── queueMicrotask ──
        case 'queueMicrotask': {
          const queueLabel = 'queueMicrotask(cb)';

          steps.push({
            line: stmt.startLine,
            actions: [
              { type: 'pushStack', label: 'queueMicrotask(cb)' },
              { type: 'addMicroQueue', label: queueLabel },
              { type: 'popStack', delay: 300 },
            ],
            glow: ['boxStack', 'boxMicro'],
            narrateColor: 'var(--microtask)',
            narration: `<em style="color:var(--stack)">Line ${lineNum}</em> \u2014 <code>queueMicrotask</code> places a callback directly into the <em style="color:var(--microtask)">Microtask Queue</em>.`,
          });

          microtasks.push({ stmt, queueLabel });
          break;
        }

        // ── new Promise ──
        case 'newPromise': {
          steps.push({
            line: stmt.startLine,
            actions: [
              { type: 'pushStack', label: 'new Promise(executor)' },
              { type: 'allocHeap', label: 'Promise {}' },
              { type: 'popStack', delay: 400 },
            ],
            glow: ['boxStack', 'boxHeap'],
            narrateColor: 'var(--heap)',
            narration: `<em style="color:var(--stack)">Line ${lineNum}</em> \u2014 A <code>new Promise</code> is created. The executor function runs <strong>synchronously</strong>. The Promise object is allocated on the <em style="color:var(--heap)">heap</em>.`,
          });
          break;
        }

        // ── fetch ──
        case 'fetch': {
          steps.push({
            line: stmt.startLine,
            actions: [
              { type: 'pushStack', label: 'fetch(...)' },
              { type: 'addWebApi', label: 'fetch', timer: 'pending' },
              { type: 'allocHeap', label: 'Promise {}' },
              { type: 'popStack', delay: 300 },
            ],
            glow: ['boxStack', 'boxWebapi', 'boxHeap'],
            narrateColor: 'var(--webapi)',
            narration: `<em style="color:var(--stack)">Line ${lineNum}</em> \u2014 <code>fetch</code> is pushed onto the stack. The network request is <em style="color:var(--webapi)">handed off to the Web API</em>. A Promise is returned and allocated on the heap.`,
          });
          break;
        }

        // ── Variable: primitive ──
        case 'varPrimitive': {
          steps.push({
            line: stmt.startLine,
            actions: [
              { type: 'pushStack', label: `${stmt.keyword} ${stmt.name} = ${truncate(stmt.value || '…', 15)}` },
              { type: 'popStack', delay: 250 },
            ],
            glow: ['boxStack'],
            narrateColor: 'var(--stack)',
            narration: `<em style="color:var(--stack)">Line ${lineNum}</em> \u2014 Variable <code>${stmt.name}</code> is declared with <code>${stmt.keyword}</code> and assigned the value <code>${esc(truncate(stmt.value || 'undefined', 20))}</code>. Primitives live directly on the stack frame.`,
          });
          break;
        }

        // ── Variable: object/array ──
        case 'varObject': {
          const short = truncate(stmt.value || '{}', 20);
          steps.push({
            line: stmt.startLine,
            actions: [
              { type: 'pushStack', label: `${stmt.keyword} ${stmt.name}` },
              { type: 'allocHeap', label: truncate(stmt.value || '{}', 22) },
              { type: 'popStack', delay: 300 },
            ],
            glow: ['boxStack', 'boxHeap'],
            narrateColor: 'var(--heap)',
            narration: `<em style="color:var(--stack)">Line ${lineNum}</em> \u2014 Variable <code>${stmt.name}</code> is declared. The ${/^\[/.test(stmt.value) ? 'array' : 'object'} <em style="color:var(--heap)">${esc(short)}</em> is allocated on the <em style="color:var(--heap)">heap</em>. The variable stores a reference to it.`,
          });
          break;
        }

        // ── Variable: function ──
        case 'varFunction': {
          steps.push({
            line: stmt.startLine,
            actions: [
              { type: 'pushStack', label: `${stmt.keyword} ${stmt.name} = fn` },
              { type: 'allocHeap', label: `fn ${stmt.name}()` },
              { type: 'popStack', delay: 300 },
            ],
            glow: ['boxStack', 'boxHeap'],
            narrateColor: 'var(--heap)',
            narration: `<em style="color:var(--stack)">Line ${lineNum}</em> \u2014 Variable <code>${stmt.name}</code> stores a reference to a function allocated on the <em style="color:var(--heap)">heap</em>. The function body is <strong>not</strong> executed yet.`,
          });
          break;
        }

        // ── Function declaration ──
        case 'funcDecl':
        case 'asyncFuncDecl': {
          steps.push({
            line: stmt.startLine,
            actions: [
              { type: 'allocHeap', label: `fn ${stmt.name}()` },
            ],
            glow: ['boxHeap'],
            narrateColor: 'var(--heap)',
            narration: `<em style="color:var(--stack)">Line ${lineNum}</em> \u2014 Function <code>${stmt.name}</code> is declared and hoisted. The function object is allocated on the <em style="color:var(--heap)">heap</em>. Its body does not execute until the function is called.`,
          });
          break;
        }

        // ── Class declaration ──
        case 'classDecl': {
          steps.push({
            line: stmt.startLine,
            actions: [
              { type: 'allocHeap', label: `class ${stmt.name}` },
            ],
            glow: ['boxHeap'],
            narrateColor: 'var(--heap)',
            narration: `<em style="color:var(--stack)">Line ${lineNum}</em> \u2014 Class <code>${stmt.name}</code> is defined and stored on the <em style="color:var(--heap)">heap</em>.`,
          });
          break;
        }

        // ── Generic function call ──
        case 'funcCall': {
          const name = stmt.name || 'anonymous';
          steps.push({
            line: stmt.startLine,
            actions: [
              { type: 'pushStack', label: truncate(stmt.fullText.trim(), 30) },
              { type: 'popStack', delay: 400 },
            ],
            glow: ['boxStack'],
            narrateColor: 'var(--stack)',
            narration: `<em style="color:var(--stack)">Line ${lineNum}</em> \u2014 <code>${esc(name)}</code> is called. A new execution context is pushed onto the <em style="color:var(--stack)">call stack</em>, runs, and pops off when done.`,
          });
          break;
        }

        // ── Control flow (if / for / while / etc.) ──
        case 'if':
        case 'elseIf':
        case 'else':
        case 'for':
        case 'while':
        case 'switch':
        case 'try':
        case 'catch': {
          const keyword = stmt.type === 'elseIf' ? 'else if' : stmt.type;
          steps.push({
            line: stmt.startLine,
            actions: [
              { type: 'pushStack', label: `${keyword} (…)` },
              { type: 'popStack', delay: 300 },
            ],
            glow: ['boxStack'],
            narrateColor: 'var(--stack)',
            narration: `<em style="color:var(--stack)">Line ${lineNum}</em> \u2014 <code>${keyword}</code> block is evaluated. The condition is checked on the stack and the appropriate branch is entered.`,
          });
          break;
        }

        // ── Return ──
        case 'return': {
          steps.push({
            line: stmt.startLine,
            actions: [
              { type: 'pushStack', label: truncate(stmt.fullText.trim(), 28) },
              { type: 'popStack', delay: 300 },
            ],
            glow: ['boxStack'],
            narrateColor: 'var(--stack)',
            narration: `<em style="color:var(--stack)">Line ${lineNum}</em> \u2014 <code>return</code> passes a value back to the caller. The current execution context will be popped from the stack.`,
          });
          break;
        }

        // ── Assignment ──
        case 'assignment': {
          steps.push({
            line: stmt.startLine,
            actions: [
              { type: 'pushStack', label: truncate(stmt.fullText.trim(), 28) },
              { type: 'popStack', delay: 250 },
            ],
            glow: ['boxStack'],
            narrateColor: 'var(--stack)',
            narration: `<em style="color:var(--stack)">Line ${lineNum}</em> \u2014 Assignment evaluated on the stack. The value is updated in the current scope.`,
          });
          break;
        }

        // ── Await ──
        case 'await': {
          steps.push({
            line: stmt.startLine,
            actions: [
              { type: 'pushStack', label: truncate(stmt.fullText.trim(), 28) },
              { type: 'popStack', delay: 500 },
            ],
            glow: ['boxStack', 'boxEventloop'],
            narrateColor: 'var(--eventloop)',
            narration: `<em style="color:var(--stack)">Line ${lineNum}</em> \u2014 <code>await</code> pauses the async function. The rest of the function is scheduled as a microtask when the awaited promise resolves. The <em style="color:var(--eventloop)">event loop</em> can process other tasks in the meantime.`,
          });
          break;
        }

        // ── Generic expression (fallback) ──
        case 'expression': {
          steps.push({
            line: stmt.startLine,
            actions: [
              { type: 'pushStack', label: truncate(stmt.fullText.trim(), 28) },
              { type: 'popStack', delay: 250 },
            ],
            glow: ['boxStack'],
            narrateColor: 'var(--stack)',
            narration: `<em style="color:var(--stack)">Line ${lineNum}</em> \u2014 Expression evaluated on the stack.`,
          });
          break;
        }

        // Skip anything else (blockClose, etc.)
        default:
          break;
      }
    }

    // ── Step: pop global ──
    const lastSyncLine = [...classified].reverse().find(s =>
      s.type !== 'empty' && s.type !== 'comment' && s.type !== 'blockClose'
    );

    if (microtasks.length > 0 || macrotasks.length > 0) {
      steps.push({
        line: lastSyncLine ? lastSyncLine.endLine : null,
        actions: [
          { type: 'popStack', delay: 0 },
        ],
        glow: ['boxStack', 'boxEventloop'],
        narrateColor: 'var(--eventloop)',
        narration: 'The <em style="color:var(--stack)">&lt;global&gt;</em> context pops off. The call stack is now <strong>empty</strong>. This signals the <em style="color:var(--eventloop)">Event Loop</em> to wake up and check the queues.',
      });
    } else {
      steps.push({
        line: lastSyncLine ? lastSyncLine.endLine : null,
        actions: [
          { type: 'popStack', delay: 0 },
          { type: 'eventLoopIdle' },
        ],
        glow: ['boxStack'],
        narrateColor: 'var(--stack)',
        narration: 'The <em style="color:var(--stack)">&lt;global&gt;</em> context pops off. All synchronous code has executed. No async callbacks were scheduled, so we\u2019re done!',
      });
    }

    // ── Drain microtask queue ──
    for (let i = 0; i < microtasks.length; i++) {
      const mt = microtasks[i];
      const cbActions = analyzeCallbackBody(mt.stmt.callbackLines || [], mt.stmt.inlineExpr || null);

      const actions = [
        { type: 'eventLoopCheck' },
        { type: 'dequeueMicro', label: mt.queueLabel },
        { type: 'pushStack', label: truncate(mt.queueLabel, 28) },
        ...cbActions,
        { type: 'popStack', delay: 400 },
      ];

      const glowSet = ['boxEventloop', 'boxMicro', 'boxStack'];
      if (cbActions.some(a => a.type === 'consoleLog')) glowSet.push('boxConsole');

      steps.push({
        line: mt.stmt.startLine,
        actions,
        glow: glowSet,
        narrateColor: 'var(--microtask)',
        narration: `<em style="color:var(--eventloop)">Event Loop</em> checks: stack empty? \u2713 \u2192 <em style="color:var(--microtask)">Microtasks first!</em> The <code>${esc(mt.queueLabel)}</code> callback is dequeued, pushed onto the stack, and executed. All microtasks drain before any macrotask runs.`,
      });
    }

    // ── Drain task queue ──
    for (let i = 0; i < macrotasks.length; i++) {
      const mt = macrotasks[i];
      const cbActions = analyzeCallbackBody(mt.stmt.callbackLines || [], mt.stmt.inlineExpr || null);

      const actions = [
        { type: 'eventLoopCheck' },
        { type: 'dequeueTask', label: mt.queueLabel },
        { type: 'pushStack', label: 'cb: setTimeout' },
        ...cbActions,
        { type: 'popStack', delay: 400 },
      ];

      const glowSet = ['boxEventloop', 'boxTask', 'boxStack'];
      if (cbActions.some(a => a.type === 'consoleLog')) glowSet.push('boxConsole');

      const isLast = i === macrotasks.length - 1 && microtasks.length === 0;
      steps.push({
        line: null,
        actions,
        glow: glowSet,
        narrateColor: 'var(--taskq)',
        narration: `Microtask queue empty \u2192 <em style="color:var(--eventloop)">Event Loop</em> grabs one macrotask from the <em style="color:var(--taskq)">Task Queue</em>. The setTimeout callback runs. This is why timer callbacks execute after all synchronous code and microtasks.`,
      });
    }

    // ── Final idle step ──
    if (microtasks.length > 0 || macrotasks.length > 0) {
      steps.push({
        line: null,
        actions: [
          { type: 'eventLoopIdle' },
        ],
        glow: ['boxEventloop'],
        narrateColor: 'var(--eventloop)',
        narration: '\u2705 <strong>Done!</strong> All queues are empty, the stack is clear. The <em style="color:var(--eventloop)">Event Loop</em> goes idle, waiting for new events.',
      });
    }

    return steps;
  }

  // ── PUBLIC API ────────────────────────────────────────────────

  return {
    analyze(code) {
      const rawLines = code.split('\n').slice(0, 50);
      const codeLines = rawLines.map(l => ({
        raw: l,
        html: highlightSyntax(l),
      }));

      const statements = groupStatements(rawLines);
      const classified = statements.map(s => classify(s));
      const steps = generateSteps(classified, rawLines.length);

      return { codeLines, steps };
    },

    // Expose for testing
    highlightSyntax,
  };
})();
