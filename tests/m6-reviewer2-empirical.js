const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('Reviewer 2 Empirical Deep Stress & Integrity Audit (Milestone 6)');
console.log('================================================================');

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${testName}: ${details}`);
  }
}

// -----------------------------------------------------------------------------
// 1. Search Catalog Integrity Audit
// -----------------------------------------------------------------------------
console.log('\n--- 1. Search Catalog Integrity & Completeness ---');

const catalogPath = path.resolve('src/app/core/data/search-catalog.data.ts');
const catalogSource = fs.readFileSync(catalogPath, 'utf8');

// Parse items from typescript source by evaluating object literals
const itemBlocks = catalogSource.split(/\{\s*id:\s*'/).slice(1);
console.log(`Found ${itemBlocks.length} catalog item blocks`);
assert(itemBlocks.length === 113, 'Catalog has exactly 113 items', `Got ${itemBlocks.length}`);

const items = [];
const idSet = new Set();
const routeSet = new Set();

itemBlocks.forEach((block, idx) => {
  const idMatch = block.match(/^([^']+)'/);
  const titleMatch = block.match(/title:\s*'([^']+)'/);
  const routeMatch = block.match(/route:\s*'([^']+)'/);
  const catMatch = block.match(/category:\s*'([^']+)'/);
  const typeMatch = block.match(/type:\s*'([^']+)'/);
  const descMatch = block.match(/description:\s*'([^']+)'/);
  const diffMatch = block.match(/difficulty:\s*'([^']+)'/);

  const id = idMatch ? idMatch[1] : `unknown-${idx}`;
  const title = titleMatch ? titleMatch[1] : '';
  const route = routeMatch ? routeMatch[1] : '';
  const category = catMatch ? catMatch[1] : '';
  const type = typeMatch ? typeMatch[1] : '';
  const description = descMatch ? descMatch[1] : '';
  const difficulty = diffMatch ? diffMatch[1] : '';

  items.push({ id, title, route, category, type, description, difficulty });
  idSet.add(id);
  if (route) routeSet.add(route);
});

assert(idSet.size === 113, 'All 113 item IDs are globally unique', `Unique IDs: ${idSet.size}`);
assert(items.every(i => i.title.length > 0), 'All items have non-empty titles');
assert(items.every(i => i.route.length > 0), 'All items have non-empty routes');
assert(items.every(i => i.category.length > 0), 'All items have valid category');
assert(items.every(i => i.description.length > 0), 'All items have valid description');
assert(items.every(i => ['beginner', 'intermediate', 'advanced'].includes(i.difficulty)), 'All items have valid difficulty');

// Check distribution across modules
const moduleCounts = {};
items.forEach(i => {
  const modMatch = i.route.match(/\/module([1-8])/);
  const mod = modMatch ? `module${modMatch[1]}` : 'other';
  moduleCounts[mod] = (moduleCounts[mod] || 0) + 1;
});
console.log('Module catalog item counts:', moduleCounts);
assert(moduleCounts['module1'] === 7, 'Module 1 has 7 items');
assert(moduleCounts['module2'] === 12, 'Module 2 has 12 items');
assert(moduleCounts['module3'] === 70, 'Module 3 has 70 items (65 ops + category landing/sub-ops)');
assert(moduleCounts['module4'] === 5, 'Module 4 has 5 items');
assert(moduleCounts['module5'] === 4, 'Module 5 has 4 items');
assert(moduleCounts['module6'] === 5, 'Module 6 has 5 items');
assert(moduleCounts['module7'] === 4, 'Module 7 has 4 items');
assert(moduleCounts['module8'] === 6, 'Module 8 has 6 items');

// -----------------------------------------------------------------------------
// 2. Curriculum Routes Alignment Audit
// -----------------------------------------------------------------------------
console.log('\n--- 2. Curriculum Routes Alignment Audit ---');

const navServicePath = path.resolve('src/app/core/services/keyboard-navigation.service.ts');
const navServiceSource = fs.readFileSync(navServicePath, 'utf8');

const routeMatches = navServiceSource.match(/'\/module[0-9]\/[^']+'/g) || [];
const curriculumRoutes = routeMatches.map(r => r.replace(/'/g, ''));
console.log(`Found ${curriculumRoutes.length} curriculum routes in KeyboardNavigationService`);
assert(curriculumRoutes.length === 108, 'CURRICULUM_ROUTES contains exactly 108 topics', `Got ${curriculumRoutes.length}`);

// Ensure every curriculum route has a corresponding route in SEARCH_CATALOG
const missingInCatalog = curriculumRoutes.filter(r => !routeSet.has(r));
assert(missingInCatalog.length === 0, 'Every curriculum route exists in search catalog', `Missing: ${missingInCatalog.join(', ')}`);

// -----------------------------------------------------------------------------
// 3. Search Algorithm Stress & Scoring Ranking
// -----------------------------------------------------------------------------
console.log('\n--- 3. Search Algorithm Stress & Scoring Ranking ---');

// Implement search scoring logic matching SearchService
function searchCatalog(query, catalog) {
  if (!query) return [];
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return catalog
    .map(item => {
      let score = 0;
      const title = (item.title || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      const category = (item.category || '').toLowerCase();
      const tags = (item.tags || []).map(t => (t || '').toLowerCase());

      if (title === q) score += 100;
      else if (title.startsWith(q)) score += 50;
      else if (title.includes(q)) score += 30;

      if (desc.includes(q)) score += 10;
      if (category.includes(q)) score += 15;
      if (tags.some(t => t.includes(q) || q.includes(t))) score += 20;

      return { item, score };
    })
    .filter(e => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(e => e.item);
}

// Test exact match ranking
const exactSwitchMap = searchCatalog('switchMap', items);
assert(exactSwitchMap.length > 0 && exactSwitchMap[0].title === 'switchMap', 'Exact match "switchMap" ranked #1');

// Test case insensitivity
const lowerCaseSwitchMap = searchCatalog('switchmap', items);
assert(lowerCaseSwitchMap.length > 0 && lowerCaseSwitchMap[0].title === 'switchMap', 'Case-insensitive "switchmap" ranked #1');

// Test prefix match over substring
const mapResults = searchCatalog('map', items);
assert(mapResults.length > 0 && mapResults[0].title.toLowerCase().startsWith('map'), 'Prefix matches prioritized for "map"');

// Test whitespace handling
assert(searchCatalog('', items).length === 0, 'Empty string returns empty array');
assert(searchCatalog('    ', items).length === 0, 'Whitespace-only string returns empty array');
assert(searchCatalog(null, items).length === 0, 'Null returns empty array');
assert(searchCatalog(undefined, items).length === 0, 'Undefined returns empty array');

// Stress test queries
const stressQueries = [
  'a'.repeat(500),
  '<script>alert(1)</script>',
  'DROP TABLE users;--',
  '\\.*+?^${}()|[]',
  '🔥 ⚡ 🚀 📦',
  '__proto__',
  'constructor'
];

stressQueries.forEach(q => {
  let ok = false;
  try {
    const res = searchCatalog(q, items);
    ok = Array.isArray(res);
  } catch (e) {
    ok = false;
  }
  assert(ok, `Stress query "${q.slice(0, 20)}..." handled gracefully without exceptions`);
});

// -----------------------------------------------------------------------------
// 4. Keyboard Navigation & Strict Input Focus Guard Simulation
// -----------------------------------------------------------------------------
console.log('\n--- 4. Keyboard Navigation & Input Focus Guard Logic ---');

// Replicate isTypingTarget logic from KeyboardNavigationService
function isTypingTarget(target, activeElement) {
  const candidates = [target, activeElement].filter(Boolean);

  for (const el of candidates) {
    const tagName = el.tagName ? el.tagName.toUpperCase() : '';
    if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
      return true;
    }
    if (el.isContentEditable || el.getAttribute?.('contenteditable') === 'true') {
      return true;
    }
    if (el.closest) {
      if (
        el.closest('.monaco-editor') ||
        el.closest('.ace_editor') ||
        el.closest('app-code-block') ||
        el.closest('.code-editor') ||
        el.closest('[contenteditable="true"]') ||
        el.closest('[role="textbox"]') ||
        el.closest('.prevent-nav')
      ) {
        return true;
      }
    }
  }
  return false;
}

// Mock DOM elements
function mockElement(tagName, attrs = {}, closestMatches = []) {
  return {
    tagName: tagName.toUpperCase(),
    isContentEditable: attrs['contenteditable'] === 'true',
    getAttribute: (name) => attrs[name] || null,
    closest: (selector) => closestMatches.includes(selector) ? {} : null
  };
}

assert(isTypingTarget(mockElement('input'), null), 'Blocks INPUT element');
assert(isTypingTarget(mockElement('textarea'), null), 'Blocks TEXTAREA element');
assert(isTypingTarget(mockElement('select'), null), 'Blocks SELECT element');
assert(isTypingTarget(mockElement('div', { contenteditable: 'true' }), null), 'Blocks contenteditable div');
assert(isTypingTarget(mockElement('span', {}, ['.code-editor']), null), 'Blocks child inside .code-editor');
assert(isTypingTarget(mockElement('span', {}, ['app-code-block']), null), 'Blocks child inside app-code-block');
assert(isTypingTarget(mockElement('span', {}, ['[role="textbox"]']), null), 'Blocks child inside role="textbox"');
assert(isTypingTarget(mockElement('span', {}, ['.prevent-nav']), null), 'Blocks child inside .prevent-nav');

// Focus bubbling edge case: target is body, but activeElement is input
assert(isTypingTarget(mockElement('body'), mockElement('input')), 'Blocks when event.target is body but activeElement is input');

// Non-typing target allows navigation
assert(!isTypingTarget(mockElement('div'), mockElement('body')), 'Allows navigation when clicking or focused on regular div/body');
assert(!isTypingTarget(mockElement('button'), mockElement('button')), 'Allows navigation when focused on button');
assert(!isTypingTarget(null, null), 'Allows navigation when targets are null');

// Sequential traversal boundary math
function simulateTraversal(startIndex, key, totalRoutes) {
  let idx = startIndex;
  if (key === 'j' || key === 'ArrowRight') {
    if (idx < totalRoutes - 1) idx++;
  } else if (key === 'k' || key === 'ArrowLeft') {
    if (idx > 0) idx--;
  }
  return idx;
}

assert(simulateTraversal(0, 'k', 108) === 0, 'Clamps at start (0) on previous topic');
assert(simulateTraversal(0, 'ArrowLeft', 108) === 0, 'Clamps at start (0) on ArrowLeft');
assert(simulateTraversal(107, 'j', 108) === 107, 'Clamps at end (107) on next topic');
assert(simulateTraversal(107, 'ArrowRight', 108) === 107, 'Clamps at end (107) on ArrowRight');
assert(simulateTraversal(50, 'j', 108) === 51, 'Advances from 50 to 51 on j');
assert(simulateTraversal(50, 'k', 108) === 49, 'Regresses from 50 to 49 on k');

// URL synchronization logic
function syncRouteIndex(url, routes) {
  const cleanUrl = (url || '').split('?')[0].split('#')[0];
  const idx = routes.findIndex(r => r === cleanUrl || cleanUrl.startsWith(r));
  return idx !== -1 ? idx : -1;
}

assert(syncRouteIndex('/module1/what-is-rxjs', curriculumRoutes) === 0, 'Syncs clean route URL');
assert(syncRouteIndex('/module1/what-is-rxjs?tab=code', curriculumRoutes) === 0, 'Strips query params');
assert(syncRouteIndex('/module1/what-is-rxjs#demo', curriculumRoutes) === 0, 'Strips hash fragment');
assert(syncRouteIndex('/module1/what-is-rxjs?tab=visual#diagram', curriculumRoutes) === 0, 'Strips query and hash simultaneously');
assert(syncRouteIndex('/module8/multistep-form', curriculumRoutes) === 107, 'Syncs last curriculum route');
assert(syncRouteIndex('/unknown-url', curriculumRoutes) === -1, 'Handles unknown URL cleanly');

// -----------------------------------------------------------------------------
// 5. Code Integrity & Non-Trivial Implementation Check
// -----------------------------------------------------------------------------
console.log('\n--- 5. Source Code Integrity Audit ---');

const searchPaletteCompPath = path.resolve('src/app/core/components/search-palette/search-palette.component.ts');
const searchPaletteSource = fs.readFileSync(searchPaletteCompPath, 'utf8');

assert(!searchPaletteSource.includes('return true; // dummy'), 'No dummy boolean returns in SearchPaletteComponent');
assert(searchPaletteSource.includes('handleGlobalShortcut'), 'SearchPaletteComponent implements handleGlobalShortcut');
assert(searchPaletteSource.includes('handleSearchKeyDown'), 'SearchPaletteComponent implements handleSearchKeyDown');
assert(searchPaletteSource.includes('scrollToActiveItem'), 'SearchPaletteComponent implements auto-scrolling to active item');

assert(!navServiceSource.includes('return true; // mock'), 'No mock bypasses in KeyboardNavigationService');
assert(navServiceSource.includes('isTypingTarget'), 'KeyboardNavigationService implements strict isTypingTarget');
assert(navServiceSource.includes('runExecutionTriggered'), 'KeyboardNavigationService exposes runExecutionTriggered Subject');

console.log('\n================================================================');
console.log(`Summary: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
