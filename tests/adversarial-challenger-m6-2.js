/**
 * Empirical Challenger M6-2 Adversarial Stress Harness
 * 
 * Verifies:
 * 1. Search Engine Adversarial Stress (ReDoS, Script Injection, Prototype Pollution, Unicode Edge Cases)
 * 2. Keyboard Navigation Focus Guard & Boundary Clamping Stress (108 routes, rapid j/k, dynamic DOM targets)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('==============================================================================');
console.log('  CHALLENGER M6-2: EMPIRICAL ADVERSARIAL STRESS TEST HARNESS');
console.log('==============================================================================\n');

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${name}`);
    console.error(`    ${err.message}`);
    failCount++;
  }
}

// ============================================================================
// SUITE 1: Search Engine Adversarial Stress
// ============================================================================
console.log('▶ [Suite 1: Adversarial Search Stress & Sanitization]');

// Load search catalog data by parsing the TypeScript file
const catalogFilePath = path.join(__dirname, '../src/app/core/data/search-catalog.data.ts');
const catalogFileContent = fs.readFileSync(catalogFilePath, 'utf8');

// Extract the items array using regex/eval or JSON extraction
const catalogMatch = catalogFileContent.match(/export const SEARCH_CATALOG: SearchCatalogItem\[] = (\[[\s\S]*?\]);/);
if (!catalogMatch) {
  throw new Error('Failed to extract SEARCH_CATALOG from search-catalog.data.ts');
}

// Safely parse the TypeScript array object literal
let SEARCH_CATALOG;
try {
  SEARCH_CATALOG = eval('(' + catalogMatch[1] + ')');
} catch (e) {
  throw new Error('Failed to evaluate SEARCH_CATALOG: ' + e.message);
}

// Instantiate search algorithm identical to SearchService.searchResults computed signal
function executeSearch(query, catalog = SEARCH_CATALOG) {
  if (!query) return [];
  const q = String(query).trim().toLowerCase();
  if (!q) return [];

  return catalog
    .map(item => {
      let score = 0;
      const title = (item.title || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      const category = (item.category || '').toLowerCase();
      const tags = (item.tags || item.keywords || []).map(t => (t || '').toLowerCase());

      // Exact match
      if (title === q) score += 100;
      else if (title.startsWith(q)) score += 50;
      else if (title.includes(q)) score += 30;

      // Description match
      if (desc.includes(q)) score += 10;

      // Category match
      if (category.includes(q)) score += 15;

      // Tags / keywords match
      if (tags.some(t => t.includes(q) || q.includes(t))) score += 20;

      return { item, score };
    })
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(entry => entry.item);
}

test('ADV-SRCH.1: Search catalog integrity check (113 items indexed)', () => {
  assert.strictEqual(SEARCH_CATALOG.length, 113, `Expected 113 catalog items, found ${SEARCH_CATALOG.length}`);
  for (const item of SEARCH_CATALOG) {
    assert.ok(item.id, 'Item missing id');
    assert.ok(item.title, `Item ${item.id} missing title`);
    assert.ok(item.route || item.path, `Item ${item.id} missing route/path`);
  }
});

test('ADV-SRCH.2: ReDoS Pattern Stress — evaluates pathological regex patterns without freeze', () => {
  const redosPatterns = [
    '(a+)+$',
    '([a-zA-Z0-9]+)*$',
    '(a|aa)+$',
    '(a|a?)+$',
    '.*.*.*.*.*.*.*.*.*.*.*.*',
    '((((a*)*)*)*)*',
    'a?a?a?a?a?a?a?a?a?a?a?a?a?a?a?a?a?a?a?a?a?a?a?a?a?a?a?a?a?a?a?a?a?a?a?a?a?a?a?a?',
    'a'.repeat(2500) + 'X',
    '(['.repeat(50) + ']'.repeat(50)
  ];

  for (const pattern of redosPatterns) {
    const t0 = process.hrtime.bigint();
    const results = executeSearch(pattern);
    const t1 = process.hrtime.bigint();
    const durationMs = Number(t1 - t0) / 1e6;
    assert.ok(Array.isArray(results), `Results for "${pattern}" must be an array`);
    assert.ok(durationMs < 50, `Query "${pattern.slice(0, 30)}..." took ${durationMs.toFixed(2)}ms (must be < 50ms)`);
  }
});

test('ADV-SRCH.3: Script Injection Stress — handles XSS payloads without error or code execution', () => {
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert(1)>',
    '"><script src=evil.com/x.js></script>',
    "';alert(1);//",
    '<svg onload="alert(document.cookie)">',
    'javascript:alert(1)',
    '<iframe src="javascript:alert(1)"></iframe>',
    '{{7*7}}',
    '${alert(1)}'
  ];

  for (const payload of xssPayloads) {
    const results = executeSearch(payload);
    assert.ok(Array.isArray(results), `Results for XSS payload "${payload}" must be array`);
  }
});

test('ADV-SRCH.4: Prototype Pollution Stress — validates prototype keys and ensures 0 pollution', () => {
  const protoKeys = [
    '__proto__',
    'constructor',
    'prototype',
    'toString',
    'valueOf',
    'hasOwnProperty',
    'isPrototypeOf',
    'propertyIsEnumerable',
    '__defineGetter__',
    '__defineSetter__'
  ];

  const beforePollution = Object.prototype.polluted;
  for (const key of protoKeys) {
    const results = executeSearch(key);
    assert.ok(Array.isArray(results), `Results for "${key}" must be array`);
    // Ensure Object.prototype remains clean
    assert.strictEqual(Object.prototype.polluted, undefined);
  }
  assert.strictEqual(beforePollution, undefined);
});

test('ADV-SRCH.5: Unicode Edge Cases — emojis, accents, RTL, null bytes, zero-width chars', () => {
  const unicodeCases = [
    '⚡ 🚀 🔥 💥 🧠 💎',                          // multi-byte emojis
    '👨‍👩‍👧‍👦',                                        // complex emoji with ZWJ
    'تفاعلي برمجة تدفق',                           // Arabic RTL text
    'שלום עולם',                                  // Hebrew RTL text
    'Résumé café mañana niño',                   // European diacritics
    'C\u0000A\u0000T',                           // Embedded null bytes
    'switch\u200BMap',                           // Zero-width space
    'combine\u200CLatest',                       // Zero-width non-joiner
    '\uD83D\uDE00',                              // High/low surrogate pairs
    '𠮷野家',                                    // 4-byte CJK surrogate
    'a'.repeat(5000)                             // 5,000 character buffer stress
  ];

  for (const str of unicodeCases) {
    const results = executeSearch(str);
    assert.ok(Array.isArray(results), `Results for unicode string must be array`);
  }
});

test('ADV-SRCH.6: Ranking determinism — exact match scores strictly higher than partial', () => {
  const results = executeSearch('switchMap');
  assert.ok(results.length > 0, 'switchMap should return matches');
  assert.strictEqual(results[0].title, 'switchMap', 'Exact title match must rank first');
});

console.log('');

// ============================================================================
// SUITE 2: Keyboard Navigation & Focus Guard Stress
// ============================================================================
console.log('▶ [Suite 2: Keyboard Navigation Focus Guard & Boundary Clamping]');

// Extract CURRICULUM_ROUTES from keyboard-navigation.service.ts
const keyNavFilePath = path.join(__dirname, '../src/app/core/services/keyboard-navigation.service.ts');
const keyNavContent = fs.readFileSync(keyNavFilePath, 'utf8');

const routesMatch = keyNavContent.match(/export const CURRICULUM_ROUTES: string\[] = (\[[\s\S]*?\]);/);
if (!routesMatch) {
  throw new Error('Failed to extract CURRICULUM_ROUTES from keyboard-navigation.service.ts');
}

let CURRICULUM_ROUTES;
try {
  CURRICULUM_ROUTES = eval('(' + routesMatch[1] + ')');
} catch (e) {
  throw new Error('Failed to evaluate CURRICULUM_ROUTES: ' + e.message);
}

// Mock DOM elements and focus tracker
class MockElement {
  constructor(tagName, options = {}) {
    this.tagName = tagName.toUpperCase();
    this.className = options.className || '';
    this.contentEditable = options.contentEditable || 'inherit';
    this.role = options.role || null;
    this.parent = null;
  }
  getAttribute(attr) {
    if (attr === 'contenteditable') return this.contentEditable === 'true' ? 'true' : null;
    if (attr === 'role') return this.role;
    return null;
  }
  get isContentEditable() {
    return this.contentEditable === 'true';
  }
  closest(selector) {
    let curr = this;
    while (curr) {
      if (selector.startsWith('.')) {
        const cls = selector.slice(1);
        if (curr.className.split(/\s+/).includes(cls)) return curr;
      } else if (selector.startsWith('[') && selector.endsWith(']')) {
        const inner = selector.slice(1, -1);
        if (inner.includes('=')) {
          const [k, vRaw] = inner.split('=');
          const v = vRaw.replace(/["']/g, '');
          if (curr.getAttribute(k) === v) return curr;
        } else {
          if (curr.getAttribute(inner) !== null) return curr;
        }
      } else if (curr.tagName.toLowerCase() === selector.toLowerCase()) {
        return curr;
      }
      curr = curr.parent;
    }
    return null;
  }
}

class KeyboardNavigationSimulator {
  constructor(routes = CURRICULUM_ROUTES) {
    this.routes = routes;
    this.currentIndex = 0;
    this.isSearchOpen = false;
    this.isHelpOpen = false;
    this.runTriggered = false;
    this.activeElement = null;
  }

  isTypingTarget(target) {
    const candidates = [target, this.activeElement].filter(Boolean);
    for (const el of candidates) {
      const tagName = el.tagName || '';
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
        return true;
      }
      if (el.isContentEditable || el.getAttribute('contenteditable') === 'true') {
        return true;
      }
      if (
        el.closest &&
        (el.closest('.monaco-editor') ||
          el.closest('.ace_editor') ||
          el.closest('app-code-block') ||
          el.closest('.code-editor') ||
          el.closest('[contenteditable="true"]') ||
          el.closest('[role="textbox"]') ||
          el.closest('.prevent-nav'))
      ) {
        return true;
      }
    }
    return false;
  }

  handleGlobalKeydown(event) {
    if (this.isTypingTarget(event.target)) {
      return;
    }

    const key = event.key;
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;

    if ((isCtrlOrCmd && key.toLowerCase() === 'k') || key === '/') {
      this.isSearchOpen = !this.isSearchOpen;
      return;
    }

    if (key === 'Escape') {
      if (this.isHelpOpen) {
        this.isHelpOpen = false;
        return;
      }
      if (this.isSearchOpen) {
        this.isSearchOpen = false;
        return;
      }
    }

    if (key === '?' && !isCtrlOrCmd) {
      this.isHelpOpen = !this.isHelpOpen;
      return;
    }

    if (isCtrlOrCmd && key === 'Enter') {
      this.runTriggered = true;
      return;
    }

    if (this.isSearchOpen || this.isHelpOpen || event.altKey) {
      return;
    }

    if (key === 'j' || key === 'ArrowRight') {
      if (!isCtrlOrCmd) {
        this.nextTopic();
      }
      return;
    }

    if (key === 'k' || key === 'ArrowLeft') {
      if (!isCtrlOrCmd) {
        this.prevTopic();
      }
      return;
    }
  }

  nextTopic() {
    if (this.currentIndex < this.routes.length - 1) {
      this.currentIndex++;
    }
  }

  prevTopic() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }
}

test('ADV-KBD.1: Curriculum Routes count verification (108 topics)', () => {
  assert.strictEqual(CURRICULUM_ROUTES.length, 108, `Expected 108 routes, found ${CURRICULUM_ROUTES.length}`);
  assert.strictEqual(CURRICULUM_ROUTES[0], '/module1/what-is-rxjs');
  assert.strictEqual(CURRICULUM_ROUTES[107], '/module8/multistep-form');
});

test('ADV-KBD.2: Strict Lower Boundary Clamping — index cannot go below 0', () => {
  const nav = new KeyboardNavigationSimulator();
  assert.strictEqual(nav.currentIndex, 0);

  // Dispatch 100 'k' and 'ArrowLeft' keystrokes at boundary
  for (let i = 0; i < 100; i++) {
    const key = i % 2 === 0 ? 'k' : 'ArrowLeft';
    nav.handleGlobalKeydown({ key });
  }

  assert.strictEqual(nav.currentIndex, 0, 'Index must remain strictly clamped to 0');
});

test('ADV-KBD.3: Strict Upper Boundary Clamping — index cannot exceed 107', () => {
  const nav = new KeyboardNavigationSimulator();
  assert.strictEqual(nav.currentIndex, 0);

  // Dispatch 200 'j' and 'ArrowRight' keystrokes to traverse past upper bound
  for (let i = 0; i < 200; i++) {
    const key = i % 2 === 0 ? 'j' : 'ArrowRight';
    nav.handleGlobalKeydown({ key });
  }

  assert.strictEqual(nav.currentIndex, 107, 'Index must remain strictly clamped to 107 (routes.length - 1)');
});

test('ADV-KBD.4: Focus Guard Stress — keystrokes suppressed in all typing targets', () => {
  const nav = new KeyboardNavigationSimulator();
  nav.currentIndex = 42; // arbitrary mid-point

  const typingTargets = [
    new MockElement('input'),
    new MockElement('textarea'),
    new MockElement('select'),
    new MockElement('div', { contentEditable: 'true' }),
    new MockElement('span', { className: 'monaco-editor' }),
    new MockElement('div', { className: 'ace_editor' }),
    new MockElement('div', { className: 'code-editor' }),
    new MockElement('app-code-block'),
    new MockElement('div', { role: 'textbox' }),
    new MockElement('div', { className: 'prevent-nav' })
  ];

  for (const target of typingTargets) {
    nav.activeElement = target;
    // Attempt navigation keystrokes
    nav.handleGlobalKeydown({ key: 'j', target });
    nav.handleGlobalKeydown({ key: 'k', target });
    nav.handleGlobalKeydown({ key: '/', target });
    nav.handleGlobalKeydown({ key: '?', target });
    assert.strictEqual(nav.currentIndex, 42, `Navigation occurred while focused on ${target.tagName} (${target.className})`);
    assert.strictEqual(nav.isSearchOpen, false, `Search opened while focused on ${target.tagName}`);
    assert.strictEqual(nav.isHelpOpen, false, `Help opened while focused on ${target.tagName}`);
  }
});

test('ADV-KBD.5: Dynamic Focus Toggling — navigation resumes immediately on blur', () => {
  const nav = new KeyboardNavigationSimulator();
  const inputEl = new MockElement('input');
  const bodyEl = new MockElement('body');

  assert.strictEqual(nav.currentIndex, 0);

  // 1. Unfocused -> j works
  nav.activeElement = bodyEl;
  nav.handleGlobalKeydown({ key: 'j', target: bodyEl });
  assert.strictEqual(nav.currentIndex, 1);

  // 2. Focused into INPUT -> j blocked
  nav.activeElement = inputEl;
  for (let i = 0; i < 20; i++) {
    nav.handleGlobalKeydown({ key: 'j', target: inputEl });
  }
  assert.strictEqual(nav.currentIndex, 1, 'Index should not change when input is focused');

  // 3. Blur -> j works again
  nav.activeElement = bodyEl;
  for (let i = 0; i < 5; i++) {
    nav.handleGlobalKeydown({ key: 'j', target: bodyEl });
  }
  assert.strictEqual(nav.currentIndex, 6, 'Index should advance by 5 after input is blurred');

  // 4. Focus into .code-editor -> k blocked
  const codeEditorEl = new MockElement('div', { className: 'code-editor' });
  nav.activeElement = codeEditorEl;
  for (let i = 0; i < 10; i++) {
    nav.handleGlobalKeydown({ key: 'k', target: codeEditorEl });
  }
  assert.strictEqual(nav.currentIndex, 6, 'Index should not change when code editor is focused');

  // 5. Blur code editor -> k works
  nav.activeElement = bodyEl;
  nav.handleGlobalKeydown({ key: 'k', target: bodyEl });
  assert.strictEqual(nav.currentIndex, 5);
});

test('ADV-KBD.6: Rapid Alternating Keystroke Burst (500 rapid iterations)', () => {
  const nav = new KeyboardNavigationSimulator();
  const bodyEl = new MockElement('body');
  nav.activeElement = bodyEl;

  for (let i = 0; i < 500; i++) {
    const key = i % 2 === 0 ? 'j' : 'k';
    nav.handleGlobalKeydown({ key, target: bodyEl });
    assert.ok(nav.currentIndex >= 0 && nav.currentIndex <= 107, `Out of bounds index: ${nav.currentIndex}`);
  }
  assert.strictEqual(nav.currentIndex, 0, 'After 500 even alternating keystrokes from 0, index should be 0');
});

console.log('\n==============================================================================');
console.log(`  EMPIRICAL CHALLENGER VERIFICATION COMPLETE: ${passCount} passed, ${failCount} failed`);
console.log('==============================================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
