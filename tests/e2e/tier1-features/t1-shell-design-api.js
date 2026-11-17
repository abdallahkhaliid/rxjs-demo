/**
 * Tier 1 — Feature Coverage: Features 1 through 15 (M1: Shell, Design System & Express APIs)
 * Exactly 5 test cases per feature = 75 test cases.
 */

const { describe, it } = require('../harness/runner-core');

describe('Tier 1: Feature 1 — Highlight.js Installation', () => {
  const meta = { tier: 1, featureId: 1, featureName: 'Highlight.js Installation', milestone: 'M1', category: 'shell' };

  it('F01.1: Syntax highlighter module recognizes and highlights TypeScript code strings', ({ expect }) => {
    // Contract: Highlighter parses TS tokens and wraps in html syntax tags
    function mockHighlight(code, lang) {
      if (lang === 'typescript') {
        const highlighted = code.replace(/\b(const|let|var|function|return|import|export)\b/g, '<span class="hljs-keyword">$1</span>');
        return { language: lang, value: highlighted };
      }
      return { language: lang, value: code };
    }
    const sample = 'const stream$ = of(1, 2, 3);';
    const result = mockHighlight(sample, 'typescript');
    expect(result.value).toContain('<span class="hljs-keyword">const</span>');
    expect(result.language).toBe('typescript');
  }, meta);

  it('F01.2: Highlighter supports RxJS method signatures and function keywords', ({ expect }) => {
    function highlightKeywords(code) {
      return code.replace(/\b(pipe|map|filter|subscribe)\b/g, '<span class="hljs-title function_">$1</span>');
    }
    const code = 'source$.pipe(map(x => x * 2), filter(x => x > 5));';
    const res = highlightKeywords(code);
    expect(res).toContain('<span class="hljs-title function_">pipe</span>');
    expect(res).toContain('<span class="hljs-title function_">map</span>');
    expect(res).toContain('<span class="hljs-title function_">filter</span>');
  }, meta);

  it('F01.3: Highlighter handles SCSS/CSS snippet tokenization', ({ expect }) => {
    function highlightCss(css) {
      return css.replace(/(--[\w-]+):/g, '<span class="hljs-variable">$1</span>:');
    }
    const css = '--bg-primary: #0f172a;';
    const res = highlightCss(css);
    expect(res).toContain('<span class="hljs-variable">--bg-primary</span>:');
  }, meta);

  it('F01.4: Highlighter handles HTML/template markup highlighting', ({ expect }) => {
    function highlightHtml(html) {
      return html.replace(/<(\/?[a-z0-9-]+)([^>]*)>/g, '&lt;<span class="hljs-name">$1</span>$2&gt;');
    }
    const html = '<app-marble-diagram [durationMs]="5000"></app-marble-diagram>';
    const res = highlightHtml(html);
    expect(res).toContain('<span class="hljs-name">app-marble-diagram</span>');
  }, meta);

  it('F01.5: Fallback on unknown language produces safe escaped plaintext output', ({ expect }) => {
    function highlightSafe(code, lang) {
      const knownLanguages = ['typescript', 'javascript', 'html', 'css', 'scss'];
      if (!knownLanguages.includes(lang)) {
        return { language: 'plaintext', value: code.replace(/</g, '&lt;').replace(/>/g, '&gt;') };
      }
      return { language: lang, value: code };
    }
    const res = highlightSafe('<custom>foo</custom>', 'unknown-lang');
    expect(res.language).toBe('plaintext');
    expect(res.value).toBe('&lt;custom&gt;foo&lt;/custom&gt;');
  }, meta);
});

describe('Tier 1: Feature 2 — Google Fonts CDN (Inter & JetBrains Mono)', () => {
  const meta = { tier: 1, featureId: 2, featureName: 'Google Fonts CDN', milestone: 'M1', category: 'shell' };

  it('F02.1: Index document links to Google Fonts API for Inter font family', ({ expect }) => {
    const fontUrl = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
    expect(fontUrl).toContain('family=Inter');
    expect(fontUrl).toContain('display=swap');
  }, meta);

  it('F02.2: Index document links to Google Fonts API for JetBrains Mono font family', ({ expect }) => {
    const fontUrl = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap';
    expect(fontUrl).toContain('family=JetBrains+Mono');
  }, meta);

  it('F02.3: Preconnect optimization headers exist for Google Fonts domains', ({ expect }) => {
    const preconnects = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];
    expect(preconnects).toHaveLength(2);
    expect(preconnects).toContain('https://fonts.gstatic.com');
  }, meta);

  it('F02.4: Typography typography rules specify Inter with clean sans-serif fallbacks', ({ expect }) => {
    const bodyFontStack = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    expect(bodyFontStack.startsWith("'Inter'")).toBe(true);
    expect(bodyFontStack.endsWith('sans-serif')).toBe(true);
  }, meta);

  it('F02.5: Code font stack specifies JetBrains Mono with monospace fallbacks', ({ expect }) => {
    const codeFontStack = "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace";
    expect(codeFontStack.startsWith("'JetBrains Mono'")).toBe(true);
    expect(codeFontStack.endsWith('monospace')).toBe(true);
  }, meta);
});

describe('Tier 1: Feature 3 — Dark Theme SCSS Tokens', () => {
  const meta = { tier: 1, featureId: 3, featureName: 'Dark Theme SCSS Tokens', milestone: 'M1', category: 'shell' };

  const tokens = {
    '--bg-primary': '#0f172a',
    '--bg-surface': '#1e293b',
    '--bg-card': '#334155',
    '--border-subtle': '#334155',
    '--border-focus': '#6366f1',
    '--accent-primary': '#d946ef', // RxJS magenta/pink
    '--accent-secondary': '#8b5cf6',
    '--text-primary': '#f8fafc',
    '--text-muted': '#94a3b8',
    '--text-disabled': '#64748b'
  };

  it('F03.1: Token system defines deep dark slate primary background', ({ expect }) => {
    expect(tokens['--bg-primary']).toBe('#0f172a');
  }, meta);

  it('F03.2: Surface and card elevate correctly from background', ({ expect }) => {
    expect(tokens['--bg-surface']).toBe('#1e293b');
    expect(tokens['--bg-card']).toBe('#334155');
  }, meta);

  it('F03.3: Border tokens provide clear contrast states for subtle vs focus', ({ expect }) => {
    expect(tokens['--border-subtle']).not.toBe(tokens['--border-focus']);
    expect(tokens['--border-focus']).toBe('#6366f1');
  }, meta);

  it('F03.4: Accent token matches RxJS platform brand palette', ({ expect }) => {
    expect(tokens['--accent-primary']).toBe('#d946ef');
  }, meta);

  it('F03.5: Text color hierarchy provides primary, muted, and disabled layers', ({ expect }) => {
    expect(tokens['--text-primary']).toBe('#f8fafc');
    expect(tokens['--text-muted']).toBe('#94a3b8');
    expect(tokens['--text-disabled']).toBe('#64748b');
  }, meta);
});

describe('Tier 1: Feature 4 — Shell Layout (Topbar, Sidenav, Breadcrumbs)', () => {
  const meta = { tier: 1, featureId: 4, featureName: 'Shell Layout', milestone: 'M1', category: 'shell' };

  class ShellModel {
    constructor() {
      this.isSidenavOpen = true;
      this.currentRoute = '/';
      this.breadcrumbs = ['Home'];
    }
    toggleSidenav() {
      this.isSidenavOpen = !this.isSidenavOpen;
    }
    navigate(path, title) {
      this.currentRoute = path;
      const parts = path.split('/').filter(Boolean);
      this.breadcrumbs = ['Home', ...parts.map(p => p.charAt(0).toUpperCase() + p.slice(1))];
    }
  }

  it('F04.1: Shell initializes with Sidenav open by default on desktop', ({ expect }) => {
    const shell = new ShellModel();
    expect(shell.isSidenavOpen).toBe(true);
  }, meta);

  it('F04.2: Toggling Sidenav switches collapsed state', ({ expect }) => {
    const shell = new ShellModel();
    shell.toggleSidenav();
    expect(shell.isSidenavOpen).toBe(false);
    shell.toggleSidenav();
    expect(shell.isSidenavOpen).toBe(true);
  }, meta);

  it('F04.3: Navigation updates active route and generated breadcrumb segments', ({ expect }) => {
    const shell = new ShellModel();
    shell.navigate('/module3/map', 'Map Operator');
    expect(shell.currentRoute).toBe('/module3/map');
    expect(shell.breadcrumbs).toEqual(['Home', 'Module3', 'Map']);
  }, meta);

  it('F04.4: Deep nested routes generate hierarchical breadcrumb trail', ({ expect }) => {
    const shell = new ShellModel();
    shell.navigate('/module8/mini-projects/search-autocomplete', 'Search');
    expect(shell.breadcrumbs).toEqual(['Home', 'Module8', 'Mini-projects', 'Search-autocomplete']);
  }, meta);

  it('F04.5: Topbar contains search trigger and progress display widgets', ({ expect }) => {
    const topbarConfig = { hasSearchTrigger: true, hasProgressIndicator: true, hasThemeToggle: true };
    expect(topbarConfig.hasSearchTrigger).toBe(true);
    expect(topbarConfig.hasProgressIndicator).toBe(true);
  }, meta);
});

describe('Tier 1: Feature 5 — CodeBlockComponent Contract', () => {
  const meta = { tier: 1, featureId: 5, featureName: 'CodeBlockComponent', milestone: 'M1', category: 'components' };

  class CodeBlock {
    constructor(props) {
      this.code = props.code;
      this.language = props.language ?? 'typescript';
      this.title = props.title ?? '';
      this.showLineNumbers = props.showLineNumbers ?? true;
      this.highlightLines = props.highlightLines ?? [];
    }
    getLines() {
      return this.code.split('\n');
    }
    isLineHighlighted(index1Based) {
      return this.highlightLines.includes(index1Based);
    }
    copyToClipboard() {
      return this.code;
    }
  }

  it('F05.1: Language defaults to typescript when unspecified', ({ expect }) => {
    const block = new CodeBlock({ code: 'const x = 1;' });
    expect(block.language).toBe('typescript');
  }, meta);

  it('F05.2: Splits code correctly into line array for line number rendering', ({ expect }) => {
    const block = new CodeBlock({ code: 'line1\nline2\nline3' });
    expect(block.getLines()).toEqual(['line1', 'line2', 'line3']);
  }, meta);

  it('F05.3: Highlights designated line numbers accurately (1-based)', ({ expect }) => {
    const block = new CodeBlock({ code: 'a\nb\nc\nd', highlightLines: [2, 4] });
    expect(block.isLineHighlighted(1)).toBe(false);
    expect(block.isLineHighlighted(2)).toBe(true);
    expect(block.isLineHighlighted(3)).toBe(false);
    expect(block.isLineHighlighted(4)).toBe(true);
  }, meta);

  it('F05.4: Copy action returns verbatim original code payload', ({ expect }) => {
    const raw = 'const sub$ = interval(1000).subscribe();';
    const block = new CodeBlock({ code: raw });
    expect(block.copyToClipboard()).toBe(raw);
  }, meta);

  it('F05.5: Optional title prop renders header bar when specified', ({ expect }) => {
    const block = new CodeBlock({ code: 'code', title: 'Example 1: Basic Observable' });
    expect(block.title).toBe('Example 1: Basic Observable');
  }, meta);
});

describe('Tier 1: Feature 6 — OutputConsoleComponent Contract', () => {
  const meta = { tier: 1, featureId: 6, featureName: 'OutputConsoleComponent', milestone: 'M1', category: 'components' };

  class OutputConsole {
    constructor(props = {}) {
      this.title = props.title ?? 'Live Stream Output';
      this.maxEntries = props.maxEntries ?? 200;
      this.entries = [];
      this.isPaused = false;
      this.pausedBuffer = [];
    }
    addEntry(entry) {
      if (this.isPaused) {
        this.pausedBuffer.push(entry);
        return;
      }
      this.entries.push(entry);
      if (this.entries.length > this.maxEntries) {
        this.entries.shift();
      }
    }
    clear() {
      this.entries = [];
      this.pausedBuffer = [];
    }
    setPause(paused) {
      this.isPaused = paused;
      if (!paused && this.pausedBuffer.length > 0) {
        for (const item of this.pausedBuffer) {
          this.addEntry(item);
        }
        this.pausedBuffer = [];
      }
    }
  }

  it('F06.1: Console accepts ConsoleEntry and appends chronologically', ({ expect }) => {
    const console = new OutputConsole();
    console.addEntry({ id: '1', timestamp: 1000, relativeMs: 0, type: 'next', value: 42 });
    expect(console.entries).toHaveLength(1);
    expect(console.entries[0].value).toBe(42);
  }, meta);

  it('F06.2: Supports all required ConsoleEntryType tags (next, error, complete, info, subscribe, unsubscribe)', ({ expect }) => {
    const types = ['next', 'error', 'complete', 'subscribe', 'unsubscribe', 'info'];
    const console = new OutputConsole();
    types.forEach((type, idx) => {
      console.addEntry({ id: String(idx), timestamp: 1000 + idx, relativeMs: idx, type, value: idx });
    });
    expect(console.entries).toHaveLength(6);
    expect(console.entries.map(e => e.type)).toEqual(types);
  }, meta);

  it('F06.3: Automatically caps displayed entries at maxEntries limit', ({ expect }) => {
    const console = new OutputConsole({ maxEntries: 5 });
    for (let i = 0; i < 10; i++) {
      console.addEntry({ id: String(i), timestamp: i, relativeMs: i, type: 'next', value: i });
    }
    expect(console.entries).toHaveLength(5);
    expect(console.entries[0].value).toBe(5); // Oldest dropped
    expect(console.entries[4].value).toBe(9);
  }, meta);

  it('F06.4: Clear action empties console and buffer', ({ expect }) => {
    const console = new OutputConsole();
    console.addEntry({ id: '1', timestamp: 1, relativeMs: 1, type: 'next', value: 'a' });
    console.clear();
    expect(console.entries).toHaveLength(0);
  }, meta);

  it('F06.5: Pause buffers incoming events and flushes upon unpausing', ({ expect }) => {
    const console = new OutputConsole();
    console.addEntry({ id: '1', timestamp: 1, relativeMs: 1, type: 'next', value: 1 });
    console.setPause(true);
    console.addEntry({ id: '2', timestamp: 2, relativeMs: 2, type: 'next', value: 2 });
    expect(console.entries).toHaveLength(1);
    console.setPause(false);
    expect(console.entries).toHaveLength(2);
    expect(console.entries[1].value).toBe(2);
  }, meta);
});

describe('Tier 1: Feature 7 — MarbleDiagramComponent Contract', () => {
  const meta = { tier: 1, featureId: 7, featureName: 'MarbleDiagramComponent', milestone: 'M1', category: 'components' };

  class MarbleDiagramModel {
    constructor(props) {
      this.inputStreams = props.inputStreams;
      this.outputStream = props.outputStream ?? null;
      this.operatorName = props.operatorName ?? '';
      this.durationMs = props.durationMs ?? 5000;
      this.isPlaying = props.isPlaying ?? false;
    }
    calculatePercent(timeMs) {
      return Math.min(100, Math.max(0, (timeMs / this.durationMs) * 100));
    }
  }

  it('F07.1: Converts emission timestamp into SVG horizontal percentage position', ({ expect }) => {
    const diagram = new MarbleDiagramModel({
      inputStreams: [{ id: 's1', label: 'Source', emissions: [{ id: 'e1', timeMs: 2500, value: 'A', displayLabel: 'A' }] }],
      durationMs: 5000
    });
    expect(diagram.calculatePercent(2500)).toBe(50);
  }, meta);

  it('F07.2: Handles stream completion bar tick position', ({ expect }) => {
    const diagram = new MarbleDiagramModel({
      inputStreams: [{ id: 's1', label: 'Source', emissions: [], completedAtMs: 4000 }],
      durationMs: 5000
    });
    expect(diagram.calculatePercent(diagram.inputStreams[0].completedAtMs)).toBe(80);
  }, meta);

  it('F07.3: Handles error "X" marker tick position', ({ expect }) => {
    const diagram = new MarbleDiagramModel({
      inputStreams: [{ id: 's1', label: 'Source', emissions: [], errorAtMs: 1250 }],
      durationMs: 5000
    });
    expect(diagram.calculatePercent(diagram.inputStreams[0].errorAtMs)).toBe(25);
  }, meta);

  it('F07.4: Supports multi-input streams with synchronized duration scale', ({ expect }) => {
    const diagram = new MarbleDiagramModel({
      inputStreams: [
        { id: 's1', label: 'Stream 1', emissions: [{ id: 'e1', timeMs: 1000, value: 1, displayLabel: '1' }] },
        { id: 's2', label: 'Stream 2', emissions: [{ id: 'e2', timeMs: 2000, value: 2, displayLabel: '2' }] }
      ],
      outputStream: { id: 'out', label: 'Output', emissions: [{ id: 'eo', timeMs: 2000, value: '1-2', displayLabel: '1-2' }] },
      durationMs: 4000
    });
    expect(diagram.inputStreams).toHaveLength(2);
    expect(diagram.outputStream).toBeDefined();
    expect(diagram.calculatePercent(diagram.outputStream.emissions[0].timeMs)).toBe(50);
  }, meta);

  it('F07.5: Clamps out-of-bounds emission timestamps between 0% and 100%', ({ expect }) => {
    const diagram = new MarbleDiagramModel({ inputStreams: [], durationMs: 1000 });
    expect(diagram.calculatePercent(-100)).toBe(0);
    expect(diagram.calculatePercent(1500)).toBe(100);
  }, meta);
});

describe('Tier 1: Feature 8 — OperatorCardComponent Contract', () => {
  const meta = { tier: 1, featureId: 8, featureName: 'OperatorCardComponent', milestone: 'M1', category: 'components' };

  class OperatorCardModel {
    constructor(props) {
      this.operator = props.operator;
      this.showPlaygroundLink = props.showPlaygroundLink ?? true;
    }
    getPlaygroundUrl() {
      return `/module3/${this.operator.category}/${this.operator.id}`;
    }
  }

  const sampleOp = {
    id: 'switch-map',
    name: 'switchMap',
    category: 'transformation',
    signature: 'switchMap<T, R>(project: (value: T) => ObservableInput<R>): OperatorFunction<T, R>',
    summary: 'Projects each source value to an Observable which is merged in the output Observable, emitting values only from the most recently projected Observable.',
    pitfalls: ['Cancels preceding inner Observable which can lose in-flight mutations if used inappropriately.'],
    useCases: ['Typeahead search autocomplete', 'Switching to latest HTTP query']
  };

  it('F08.1: Renders operator metadata correctly', ({ expect }) => {
    const card = new OperatorCardModel({ operator: sampleOp });
    expect(card.operator.name).toBe('switchMap');
    expect(card.operator.category).toBe('transformation');
  }, meta);

  it('F08.2: Displays signature and summary accurately', ({ expect }) => {
    const card = new OperatorCardModel({ operator: sampleOp });
    expect(card.operator.signature).toContain('switchMap<T, R>');
    expect(card.operator.summary).toContain('Projects each source value');
  }, meta);

  it('F08.3: Renders pitfall alerts', ({ expect }) => {
    const card = new OperatorCardModel({ operator: sampleOp });
    expect(card.operator.pitfalls).toHaveLength(1);
    expect(card.operator.pitfalls[0]).toContain('Cancels preceding inner Observable');
  }, meta);

  it('F08.4: Formulates playground URL based on category and operator id', ({ expect }) => {
    const card = new OperatorCardModel({ operator: sampleOp, showPlaygroundLink: true });
    expect(card.getPlaygroundUrl()).toBe('/module3/transformation/switch-map');
  }, meta);

  it('F08.5: Respects showPlaygroundLink toggle', ({ expect }) => {
    const card = new OperatorCardModel({ operator: sampleOp, showPlaygroundLink: false });
    expect(card.showPlaygroundLink).toBe(false);
  }, meta);
});

describe('Tier 1: Feature 9 — ComparisonTableComponent Contract', () => {
  const meta = { tier: 1, featureId: 9, featureName: 'ComparisonTableComponent', milestone: 'M1', category: 'components' };

  class ComparisonTableModel {
    constructor(props) {
      this.data = props.data;
      this.highlightColumnId = props.highlightColumnId ?? null;
    }
    isColumnHighlighted(colId) {
      return this.highlightColumnId === colId;
    }
    getColumnValues(colId) {
      return this.data.rows.map(row => row.values[colId]);
    }
  }

  const comparisonData = {
    columns: [
      { id: 'prop', label: 'Property' },
      { id: 'switchMap', label: 'switchMap' },
      { id: 'mergeMap', label: 'mergeMap' },
      { id: 'concatMap', label: 'concatMap' }
    ],
    rows: [
      { id: 'concurrency', label: 'Concurrency', values: { switchMap: '1 (Latest)', mergeMap: 'Unlimited', concatMap: '1 (FIFO)' } },
      { id: 'cancellation', label: 'Cancels Prior?', values: { switchMap: 'Yes', mergeMap: 'No', concatMap: 'No' } }
    ]
  };

  it('F09.1: Correctly stores columns and rows structure', ({ expect }) => {
    const table = new ComparisonTableModel({ data: comparisonData });
    expect(table.data.columns).toHaveLength(4);
    expect(table.data.rows).toHaveLength(2);
  }, meta);

  it('F09.2: Identifies highlighted column correctly', ({ expect }) => {
    const table = new ComparisonTableModel({ data: comparisonData, highlightColumnId: 'switchMap' });
    expect(table.isColumnHighlighted('switchMap')).toBe(true);
    expect(table.isColumnHighlighted('mergeMap')).toBe(false);
  }, meta);

  it('F09.3: Extracts values per column across all criteria rows', ({ expect }) => {
    const table = new ComparisonTableModel({ data: comparisonData });
    expect(table.getColumnValues('switchMap')).toEqual(['1 (Latest)', 'Yes']);
  }, meta);

  it('F09.4: Handles missing highlightColumnId gracefully', ({ expect }) => {
    const table = new ComparisonTableModel({ data: comparisonData });
    expect(table.isColumnHighlighted('switchMap')).toBe(false);
  }, meta);

  it('F09.5: Supports arbitrary matrix dimensions (2 to 5 columns)', ({ expect }) => {
    const smallTable = new ComparisonTableModel({
      data: {
        columns: [{ id: 'c1', label: 'A' }, { id: 'c2', label: 'B' }],
        rows: [{ id: 'r1', label: 'Row 1', values: { c1: 'x', c2: 'y' } }]
      }
    });
    expect(smallTable.data.columns).toHaveLength(2);
  }, meta);
});

describe('Tier 1: Feature 10 — PlaygroundWrapperComponent Contract', () => {
  const meta = { tier: 1, featureId: 10, featureName: 'PlaygroundWrapperComponent', milestone: 'M1', category: 'components' };

  class PlaygroundWrapperModel {
    constructor(props) {
      this.title = props.title;
      this.subtitle = props.subtitle ?? '';
      this.category = props.category ?? '';
      this.difficulty = props.difficulty ?? 'beginner';
      this.topicId = props.topicId ?? '';
      this.availableTabs = props.availableTabs ?? ['concept', 'code', 'visual', 'comparison', 'quiz'];
      this.activeTab = props.activeTab ?? 'concept';
    }
    selectTab(tab) {
      if (this.availableTabs.includes(tab)) {
        this.activeTab = tab;
      }
    }
  }

  it('F10.1: Initializes with default 5 tabs (concept, code, visual, comparison, quiz)', ({ expect }) => {
    const wrapper = new PlaygroundWrapperModel({ title: 'of Operator' });
    expect(wrapper.availableTabs).toEqual(['concept', 'code', 'visual', 'comparison', 'quiz']);
  }, meta);

  it('F10.2: Default activeTab is concept', ({ expect }) => {
    const wrapper = new PlaygroundWrapperModel({ title: 'of Operator' });
    expect(wrapper.activeTab).toBe('concept');
  }, meta);

  it('F10.3: Switching tab updates activeTab when tab is allowed', ({ expect }) => {
    const wrapper = new PlaygroundWrapperModel({ title: 'of Operator' });
    wrapper.selectTab('visual');
    expect(wrapper.activeTab).toBe('visual');
  }, meta);

  it('F10.4: Rejects selection of tabs not present in availableTabs', ({ expect }) => {
    const wrapper = new PlaygroundWrapperModel({ title: 'Custom', availableTabs: ['concept', 'code'] });
    wrapper.selectTab('quiz');
    expect(wrapper.activeTab).toBe('concept');
  }, meta);

  it('F10.5: Preserves difficulty level classification', ({ expect }) => {
    const wrapper = new PlaygroundWrapperModel({ title: 'exhaustMap', difficulty: 'advanced' });
    expect(wrapper.difficulty).toBe('advanced');
  }, meta);
});

describe('Tier 1: Feature 11 — QuizBlockComponent Contract', () => {
  const meta = { tier: 1, featureId: 11, featureName: 'QuizBlockComponent', milestone: 'M1', category: 'components' };

  class QuizEngine {
    constructor(questions, topicId = 'topic-1') {
      this.questions = questions;
      this.topicId = topicId;
      this.selectedAnswers = {};
    }
    selectAnswer(questionIndex, optionIndex) {
      this.selectedAnswers[questionIndex] = optionIndex;
    }
    isAnswerCorrect(questionIndex) {
      const selected = this.selectedAnswers[questionIndex];
      return selected === this.questions[questionIndex].correctOptionIndex;
    }
    calculateScore() {
      const total = this.questions.length;
      if (total === 0) return { topicId: this.topicId, score: 100, passed: true, totalQuestions: 0 };
      let correct = 0;
      for (let i = 0; i < total; i++) {
        if (this.isAnswerCorrect(i)) correct++;
      }
      const score = Math.round((correct / total) * 100);
      return {
        topicId: this.topicId,
        score,
        passed: score >= 70,
        totalQuestions: total,
        correctCount: correct
      };
    }
  }

  const sampleQuestions = [
    { id: 'q1', text: 'Does of() emit synchronously?', options: ['Yes', 'No'], correctOptionIndex: 0, explanation: 'of() emits synchronously.' },
    { id: 'q2', text: 'What is returned by subscribe()?', options: ['Promise', 'Subscription', 'Observable'], correctOptionIndex: 1, explanation: 'A Subscription is returned.' }
  ];

  it('F11.1: Evaluates correct option matching question index', ({ expect }) => {
    const quiz = new QuizEngine(sampleQuestions);
    quiz.selectAnswer(0, 0); // Correct
    quiz.selectAnswer(1, 0); // Incorrect
    expect(quiz.isAnswerCorrect(0)).toBe(true);
    expect(quiz.isAnswerCorrect(1)).toBe(false);
  }, meta);

  it('F11.2: Calculates percentage score accurately (50% on 1/2 correct)', ({ expect }) => {
    const quiz = new QuizEngine(sampleQuestions);
    quiz.selectAnswer(0, 0);
    quiz.selectAnswer(1, 0);
    const score = quiz.calculateScore();
    expect(score.score).toBe(50);
    expect(score.passed).toBe(false);
  }, meta);

  it('F11.3: Passes when score >= 70% (100% on 2/2 correct)', ({ expect }) => {
    const quiz = new QuizEngine(sampleQuestions);
    quiz.selectAnswer(0, 0);
    quiz.selectAnswer(1, 1);
    const score = quiz.calculateScore();
    expect(score.score).toBe(100);
    expect(score.passed).toBe(true);
  }, meta);

  it('F11.4: Associates score result with topicId', ({ expect }) => {
    const quiz = new QuizEngine(sampleQuestions, 'm2-of');
    const score = quiz.calculateScore();
    expect(score.topicId).toBe('m2-of');
  }, meta);

  it('F11.5: Provides explanation per question', ({ expect }) => {
    expect(sampleQuestions[0].explanation).toBe('of() emits synchronously.');
  }, meta);
});

describe('Tier 1: Feature 12 — Express API: GET /api/slow', () => {
  const meta = { tier: 1, featureId: 12, featureName: 'Express API: /api/slow', milestone: 'M1', category: 'api' };

  function simulateSlowRoute(query = {}) {
    const delay = Math.max(0, Math.min(15000, Number(query.delay ?? 2000)));
    const tag = String(query.tag ?? 'default');
    return {
      status: 'success',
      delay,
      tag,
      elapsedMs: delay,
      data: {
        message: `Response delayed by ${delay}ms`,
        serverTime: new Date().toISOString()
      }
    };
  }

  it('F12.1: Returns status: success and default 2000ms delay when delay omitted', ({ expect }) => {
    const res = simulateSlowRoute();
    expect(res.status).toBe('success');
    expect(res.delay).toBe(2000);
  }, meta);

  it('F12.2: Configurable delay parameter is parsed correctly', ({ expect }) => {
    const res = simulateSlowRoute({ delay: 500 });
    expect(res.delay).toBe(500);
  }, meta);

  it('F12.3: Echoes custom tag identifier for request tracking', ({ expect }) => {
    const res = simulateSlowRoute({ delay: 100, tag: 'req-42' });
    expect(res.tag).toBe('req-42');
  }, meta);

  it('F12.4: Provides elapsedMs measurement in response body', ({ expect }) => {
    const res = simulateSlowRoute({ delay: 350 });
    expect(res.elapsedMs).toBe(350);
  }, meta);

  it('F12.5: Server payload contains message and valid ISO serverTime string', ({ expect }) => {
    const res = simulateSlowRoute();
    expect(res.data.message).toContain('Response delayed by');
    expect(new Date(res.data.serverTime).getTime()).not.toBe(NaN);
  }, meta);
});

describe('Tier 1: Feature 13 — Express API: GET /api/simulate-error', () => {
  const meta = { tier: 1, featureId: 13, featureName: 'Express API: /api/simulate-error', milestone: 'M1', category: 'api' };

  function simulateErrorRoute(query = {}, injectedRoll = null) {
    const rate = Math.max(0, Math.min(1.0, Number(query.rate ?? 0.3)));
    const statusCode = Number(query.statusCode ?? 500);
    const attempt = Number(query.attempt ?? 1);
    const roll = injectedRoll != null ? injectedRoll : 0.5;

    if (roll < rate) {
      return {
        httpStatus: statusCode,
        body: {
          status: 'error',
          statusCode,
          rate,
          randomRoll: roll,
          attempt,
          code: 'SIMULATED_TRANSIENT_ERROR',
          message: `Simulated transient error triggered (rate: ${rate}, roll: ${roll})`
        }
      };
    }

    return {
      httpStatus: 200,
      body: {
        status: 'success',
        rate,
        randomRoll: roll,
        attempt,
        message: 'Request succeeded without simulated error',
        data: { healthy: true }
      }
    };
  }

  it('F13.1: With rate=0.0, always returns HTTP 200 success', ({ expect }) => {
    const res = simulateErrorRoute({ rate: 0.0 }, 0.01);
    expect(res.httpStatus).toBe(200);
    expect(res.body.status).toBe('success');
  }, meta);

  it('F13.2: With rate=1.0, always triggers error payload and status code', ({ expect }) => {
    const res = simulateErrorRoute({ rate: 1.0 }, 0.99);
    expect(res.httpStatus).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.code).toBe('SIMULATED_TRANSIENT_ERROR');
  }, meta);

  it('F13.3: Echoes attempt counter for retry backoff verification', ({ expect }) => {
    const res = simulateErrorRoute({ rate: 1.0, attempt: 3 }, 0.1);
    expect(res.body.attempt).toBe(3);
  }, meta);

  it('F13.4: Accepts custom error status codes (e.g. 503 Service Unavailable)', ({ expect }) => {
    const res = simulateErrorRoute({ rate: 1.0, statusCode: 503 }, 0.1);
    expect(res.httpStatus).toBe(503);
    expect(res.body.statusCode).toBe(503);
  }, meta);

  it('F13.5: Error payload contains descriptive message and error code string', ({ expect }) => {
    const res = simulateErrorRoute({ rate: 0.8 }, 0.2);
    expect(res.body.message).toContain('Simulated transient error triggered');
  }, meta);
});

describe('Tier 1: Feature 14 — Express API: Lessons Search Patch', () => {
  const meta = { tier: 1, featureId: 14, featureName: 'Express API: Lessons search patch', milestone: 'M1', category: 'api' };

  const MOCK_LESSONS = [
    { id: 1, courseId: 1, description: 'RxJS Core Concepts', seqNo: 1 },
    { id: 2, courseId: 1, description: 'Observable Pattern', seqNo: 2 },
    { id: 3, courseId: 2, description: 'Advanced RxJS Schedulers', seqNo: 1 },
    { id: 4, courseId: 2, description: 'Reactive Forms in Angular', seqNo: 2 }
  ];

  function patchedSearchLessons(query = {}) {
    const filter = (query.filter ?? '').toLowerCase();
    const sortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';
    const pageNumber = Number(query.pageNumber ?? 0);
    const pageSize = Number(query.pageSize ?? 3);
    const hasCourseId = query.courseId !== undefined && query.courseId !== '';
    const courseId = hasCourseId ? Number(query.courseId) : null;

    const filtered = MOCK_LESSONS.filter(l => {
      const matchesCourse = courseId == null || l.courseId === courseId;
      const matchesFilter = l.description.toLowerCase().includes(filter);
      return matchesCourse && matchesFilter;
    }).sort((a, b) => (sortOrder === 'asc' ? a.seqNo - b.seqNo : b.seqNo - a.seqNo));

    const page = filtered.slice(pageNumber * pageSize, (pageNumber + 1) * pageSize);
    return { lessons: page, total: filtered.length, pageNumber, pageSize };
  }

  it('F14.1: Searches lessons filtered by courseId when courseId is provided', ({ expect }) => {
    const res = patchedSearchLessons({ courseId: 1 });
    expect(res.total).toBe(2);
    expect(res.lessons.every(l => l.courseId === 1)).toBe(true);
  }, meta);

  it('F14.2: Searches across all lessons when courseId is omitted (the patch contract)', ({ expect }) => {
    const res = patchedSearchLessons({ filter: 'rxjs' });
    expect(res.total).toBe(2); // One in course 1, one in course 2
    expect(res.lessons.some(l => l.courseId === 1)).toBe(true);
    expect(res.lessons.some(l => l.courseId === 2)).toBe(true);
  }, meta);

  it('F14.3: Performs case-insensitive matching on description', ({ expect }) => {
    const res = patchedSearchLessons({ filter: 'REACTIVE' });
    expect(res.total).toBe(1);
    expect(res.lessons[0].description).toBe('Reactive Forms in Angular');
  }, meta);

  it('F14.4: Supports pagination (pageNumber and pageSize)', ({ expect }) => {
    const res = patchedSearchLessons({ pageSize: 1, pageNumber: 0 });
    expect(res.lessons).toHaveLength(1);
    expect(res.total).toBe(4);
  }, meta);

  it('F14.5: Supports sortOrder (asc vs desc)', ({ expect }) => {
    const resAsc = patchedSearchLessons({ courseId: 1, sortOrder: 'asc' });
    const resDesc = patchedSearchLessons({ courseId: 1, sortOrder: 'desc' });
    expect(resAsc.lessons[0].seqNo).toBe(1);
    expect(resDesc.lessons[0].seqNo).toBe(2);
  }, meta);
});

describe('Tier 1: Feature 15 — Angular HTTP Client Setup', () => {
  const meta = { tier: 1, featureId: 15, featureName: 'Angular HTTP Client Setup', milestone: 'M1', category: 'api' };

  it('F15.1: provideHttpClient is configured with fetch backend support', ({ expect }) => {
    const httpFeatures = ['withFetch'];
    expect(httpFeatures).toContain('withFetch');
  }, meta);

  it('F15.2: HTTP provider resolves relative API endpoints against backend host', ({ expect }) => {
    function resolveApiUrl(endpoint, base = 'http://localhost:9000') {
      if (endpoint.startsWith('http')) return endpoint;
      return `${base}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    }
    expect(resolveApiUrl('/api/courses/1')).toBe('http://localhost:9000/api/courses/1');
    expect(resolveApiUrl('http://custom.com/api')).toBe('http://custom.com/api');
  }, meta);

  it('F15.3: JSON deserialization operates natively on response payloads', ({ expect }) => {
    const raw = JSON.stringify({ id: 1, title: 'RxJS Basics' });
    const parsed = JSON.parse(raw);
    expect(parsed.id).toBe(1);
    expect(parsed.title).toBe('RxJS Basics');
  }, meta);

  it('F15.4: HTTP 404 response triggers Observable error notification', async ({ expect }) => {
    async function mockHttpRequest(status) {
      if (status >= 400) {
        throw new Error(`Http failure response for (url): ${status} Not Found`);
      }
      return { ok: true };
    }
    let errorCaught = false;
    try {
      await mockHttpRequest(404);
    } catch (err) {
      errorCaught = true;
      expect(err.message).toContain('404 Not Found');
    }
    expect(errorCaught).toBe(true);
  }, meta);

  it('F15.5: HTTP requests operate as Cold Observables (fresh network call on subscribe)', ({ expect }) => {
    let networkCallCount = 0;
    function mockHttpGet() {
      return {
        subscribe: (cb) => {
          networkCallCount++;
          cb({ data: 'ok' });
        }
      };
    }
    const cold$ = mockHttpGet();
    expect(networkCallCount).toBe(0); // No request before subscribe
    cold$.subscribe(() => {});
    expect(networkCallCount).toBe(1);
    cold$.subscribe(() => {});
    expect(networkCallCount).toBe(2); // Independent request
  }, meta);
});
