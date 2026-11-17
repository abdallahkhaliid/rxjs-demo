# HANDOFF REPORT — Explorer Survey 2
**Role**: Design System, Shell Architecture & Express API Specification Explorer  
**Working Directory**: `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\explorer_survey_2\`  
**Target Scope**: Requirement R1 (Shell Layout, Dark Theme SCSS Design System, Shared Interactive Components) and Requirement R2 (Express Server Extensions)  
**Date**: 2026-11-05T21:05:00Z  

---

## 1. Observation

### 1.1 Existing Codebase & Environment
- **Angular Version & Config**:
  - `package.json:26-31`: Angular packages `@angular/core`, `@angular/common`, `@angular/router`, `@angular/forms` are version `^20.3.0`.
  - `package.json:34`: RxJS is `~7.8.0`.
  - `package.json:33`: Express is `^5.3.0`.
  - `angular.json:18-20`: Uses `@angular/build:application` builder, inlineStyleLanguage `scss`, source entry `src/main.ts`, styles `src/styles.scss`.
  - `src/app/app.config.ts:8-10`: Configured with `provideBrowserGlobalErrorListeners()`, `provideZonelessChangeDetection()`, and `provideRouter(routes)`. Zoneless change detection is active.
- **Express Server**:
  - `server/server.ts:1-28`: Express application mounted on port `9000` (or `process.env.PORT`).
  - Existing endpoints:
    - `GET /` -> `{ message: 'REST API is running', endpoints: [...] }` (`server/server.ts:12-17`)
    - `GET /api/courses/:id` -> `getCourse` in `server/get-course.route.ts:4-16`
    - `PUT /api/courses/:id` -> `saveCourse` in `server/save-course-route.ts:4-16`
    - `GET /api/lessons` -> `searchLessons` in `server/search-lessons.route.ts:12-32`
  - In-memory database in `server/db-data.ts`: defines `COURSES` (3 courses: Fundamentals, Operators, Reactive Patterns) and `LESSONS` (24 lessons).
- **Styles & Typography Baseline**:
  - `src/index.html:1-14`: Standard skeleton without Google Fonts or font preconnect tags.
  - `src/styles.scss:1-2`: Empty default styles comment.
  - No external UI library is installed (no Angular Material, no Bootstrap, no Tailwind CSS).
- **Highlight.js Status**:
  - Command `npm list highlight.js` returned code 1 (`empty`). `highlight.js` is not yet installed in `package.json`.
- **Baseline Build Verification**:
  - Command `npx ng build --configuration development` executed cleanly with exit code `0` (duration 4.169s, bundle 1.38 MB).

---

## 2. Logic Chain

1. **Zoneless Architecture Consideration**:
   - Because `provideZonelessChangeDetection()` is enabled in `app.config.ts`, Angular 20 does not rely on `zone.js` monkey-patching.
   - All shared components and shell navigation MUST use Angular Signal primitives (`signal()`, `computed()`, `input()`, `output()`, `model()`) or modern Angular interop (`toSignal()`, `rxResource()`) to trigger reactive UI updates without manual zone microtasks.
2. **Design System & Typography Isolation**:
   - The user explicitly requires a dark theme shell layout using hand-crafted SCSS tokens without external UI libraries.
   - Using CSS custom properties (`:root { --token: value }`) encapsulated under SCSS variables and mixins guarantees zero overhead, instant dynamic theming capability, and seamless usage across Angular component scoped styles without SCSS `@use` path proliferation.
   - Loading Google Fonts `Inter` (UI) and `JetBrains Mono` (code, marble labels, console output) via CDN `<link>` in `src/index.html` gives crisp typography without adding bundle payload.
3. **Shared Components Decoupling**:
   - All 7 shared components (`code-block`, `output-console`, `marble-diagram`, `operator-card`, `comparison-table`, `playground-wrapper`, `quiz-block`) are stateless or locally reactive standalone components.
   - They will reside in `src/app/shared/components/` and be imported individually where needed across Modules 1 through 8.
4. **Interactive SVG Marble Diagram Architecture**:
   - Instead of Canvas or heavy external libraries, SVG provides clean vector scaling, easy DOM accessibility, CSS transitions for marble movement, and simple coordinate mapping `x = f(timeMs)`.
   - The diagram must support one or more input streams (for combination operators like `combineLatest`, `merge`, `zip`), an operator transformation block, and an output stream, with timeline markers (emissions, completion bar `|`, error cross `X`) and an animated scrubber playhead.
5. **Express API Extensions (R2)**:
   - Existing endpoints in `server/server.ts` must be preserved intact.
   - `GET /api/slow?delay=2000` must parse `delay` query param (default 2000ms), delay the response via `setTimeout`, and return descriptive diagnostic timing info.
   - `GET /api/simulate-error?rate=0.3` must evaluate `Math.random() < rate` (default 0.3) and return HTTP 500 on failure or HTTP 200 on success, ideal for demonstrating retry/catchError logic.

---

## 3. Specifications & Architecture Design

### 3.1 Google Fonts & CDN Integration
In `src/index.html`, insert preconnect and Google Fonts links inside `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
```

---

### 3.2 Hand-Crafted SCSS Token Hierarchy

Create file structure in `src/styles/`:
- `src/styles/_tokens.scss`
- `src/styles/_reset.scss`
- `src/styles/_typography.scss`
- `src/styles/_components.scss`
- `src/styles/_highlight-theme.scss`
- `src/styles/styles.scss` (imports all partials)

#### CSS Custom Properties & Token Definitions (`src/styles/_tokens.scss`)
```scss
:root {
  /* Color Palette - Dark Canvas & Surfaces */
  --color-bg-base: #0b0f19;              /* Deep background canvas */
  --color-bg-surface: #111827;           /* Card & sidenav surface */
  --color-bg-surface-elevated: #1e293b;  /* Elevated cards, dropdowns, dialogs */
  --color-bg-surface-hover: #334155;     /* Hover surface */
  --color-bg-code: #0a0d14;              /* Code editor & terminal background */
  --color-bg-overlay: rgba(11, 15, 25, 0.8); /* Modal backdrop */

  /* Borders */
  --color-border-subtle: rgba(255, 255, 255, 0.07);
  --color-border-default: rgba(255, 255, 255, 0.12);
  --color-border-strong: rgba(255, 255, 255, 0.22);
  --color-border-focus: #6366f1;

  /* Typography Colors */
  --color-text-primary: #f8fafc;         /* High emphasis headers/text */
  --color-text-secondary: #94a3b8;       /* Medium emphasis descriptions */
  --color-text-muted: #64748b;           /* Low emphasis captions/subtitles */
  --color-text-inverse: #0b0f19;

  /* Brand & Accents (RxJS Magenta/Indigo/Violet) */
  --color-primary-400: #818cf8;
  --color-primary-500: #6366f1;          /* Core Indigo */
  --color-primary-600: #4f46e5;
  --color-primary-glow: rgba(99, 102, 241, 0.25);
  --color-accent-magenta: #ec4899;       /* RxJS signature pink */
  --color-accent-purple: #a855f7;        /* Stream purple */
  --color-accent-cyan: #06b6d4;          /* Reactive cyan */

  /* Semantic Feedback Colors */
  --color-success: #10b981;
  --color-success-bg: rgba(16, 185, 129, 0.12);
  --color-success-border: rgba(16, 185, 129, 0.3);

  --color-warning: #f59e0b;
  --color-warning-bg: rgba(245, 158, 11, 0.12);
  --color-warning-border: rgba(245, 158, 11, 0.3);

  --color-danger: #ef4444;
  --color-danger-bg: rgba(239, 68, 68, 0.12);
  --color-danger-border: rgba(239, 68, 68, 0.3);

  --color-info: #38bdf8;
  --color-info-bg: rgba(56, 189, 248, 0.12);
  --color-info-border: rgba(56, 189, 248, 0.3);

  /* Marble Diagram Emission Colors */
  --color-marble-1: #f43f5e;             /* Rose */
  --color-marble-2: #f97316;             /* Orange */
  --color-marble-3: #eab308;             /* Amber */
  --color-marble-4: #10b981;             /* Emerald */
  --color-marble-5: #06b6d4;             /* Cyan */
  --color-marble-6: #6366f1;             /* Indigo */
  --color-marble-7: #a855f7;             /* Purple */
  --color-marble-8: #ec4899;             /* Pink */
  --color-marble-complete: #94a3b8;      /* Completion vertical bar */
  --color-marble-error: #ef4444;         /* Error X marker */

  /* Typography Scales */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace;

  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 1.875rem;  /* 30px */

  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.65;

  /* Spacing Scale */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;

  /* Border Radii */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* Shadows & Elevations */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.6), 0 4px 6px -4px rgba(0, 0, 0, 0.6);
  --shadow-glow: 0 0 20px var(--color-primary-glow);

  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 400ms cubic-bezier(0.4, 0, 0.2, 1);

  /* Layout Dimensions */
  --topbar-height: 64px;
  --sidenav-width: 280px;
  --content-max-width: 1400px;
}
```

---

### 3.3 Shell Layout Architecture
The shell architecture provides a cohesive layout consisting of:
1. `ShellComponent` (`src/app/core/layout/shell.component.ts`): Top-level responsive grid container hosting Topbar, Sidenav, Main Viewport, and Breadcrumbs.
2. `TopbarComponent` (`src/app/core/layout/topbar.component.ts`):
   - Branding: RxJS interactive badge + Animated logo mark.
   - Global Quick Search modal trigger (`Ctrl + K`).
   - Sidenav toggle button for mobile / narrow displays.
   - Progress Summary Widget: reads signals from `ProgressService` (e.g. `24/75 completed (32%)`).
   - Quick links: Server API Health indicator, GitHub/Documentation link.
3. `SidenavComponent` (`src/app/core/layout/sidenav.component.ts`):
   - Categorized multi-level navigation tree for all 8 modules:
     - Module 1: Fundamentals (7 topics)
     - Module 2: Creation Operators (12 operators)
     - Module 3: Operator Categories (Transformation, Filtering, Combination, Utility, Multicasting)
     - Module 4: Higher-Order Observables (`switchMap`, `mergeMap`, `concatMap`, `exhaustMap`)
     - Module 5: Subjects Sandbox (`Subject`, `BehaviorSubject`, `ReplaySubject`, `AsyncSubject`)
     - Module 6: Schedulers Visualizer
     - Module 7: RxJS in Angular (HTTP, Forms, Lifecycle, Store)
     - Module 8: Real-World Mini-Projects (6 mini-projects)
   - Route state features:
     - Active route highlighting using `RouterLinkActive` (`active` class with glowing primary border).
     - Completed topic checkmarks (green tick indicator) dynamically updated via `ProgressService`.
     - Collapsible module accordion sections with remembered open/close state.
   - Mobile slide-over drawer behavior with backdrop overlay.
4. `BreadcrumbsComponent` (`src/app/core/layout/breadcrumbs.component.ts`):
   - Automatically computes route path hierarchy (`Home > Module 3 > Transformation > switchMap`).

#### Shell Layout SCSS Wireframe
```scss
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--color-bg-base);
  color: var(--color-text-primary);
  font-family: var(--font-sans);

  .app-topbar {
    height: var(--topbar-height);
    position: sticky;
    top: 0;
    z-index: 100;
    border-bottom: 1px solid var(--color-border-subtle);
    background-color: rgba(17, 24, 39, 0.9);
    backdrop-filter: blur(12px);
  }

  .app-body {
    display: flex;
    flex: 1;
    position: relative;

    .app-sidenav {
      width: var(--sidenav-width);
      position: sticky;
      top: var(--topbar-height);
      height: calc(100vh - var(--topbar-height));
      overflow-y: auto;
      border-right: 1px solid var(--color-border-subtle);
      background-color: var(--color-bg-surface);
    }

    .app-content {
      flex: 1;
      padding: var(--space-6) var(--space-8);
      max-width: var(--content-max-width);
      margin: 0 auto;
      width: 100%;
      overflow-x: hidden;
    }
  }
}

@media (max-width: 1024px) {
  .app-shell .app-body .app-sidenav {
    position: fixed;
    left: -100%;
    transition: left var(--transition-normal);
    z-index: 90;
    &.open {
      left: 0;
    }
  }
}
```

---

### 3.4 Shared Standalone Interactive Components Specifications

#### Component 1: `CodeBlockComponent` (`app-code-block`)
- **File**: `src/app/shared/components/code-block/code-block.component.ts`
- **Dependencies**: `highlight.js` (installed via `npm install highlight.js`)
- **Inputs**:
  ```typescript
  code = input.required<string>();                   // Raw source code
  language = input<string>('typescript');            // e.g. 'typescript', 'html', 'json', 'scss'
  title = input<string>('');                         // Optional tab/file title e.g. "search.component.ts"
  showLineNumbers = input<boolean>(true);            // Show line number gutter
  highlightLines = input<number[]>([]);              // 1-based line numbers to highlight
  collapsible = input<boolean>(false);
  maxHeight = input<string>('500px');
  ```
- **Internal Signals**:
  ```typescript
  copied = signal<boolean>(false);
  isCollapsed = signal<boolean>(false);
  highlightedCode = computed<string>(() => {
    const raw = this.code();
    const lang = this.language();
    if (!raw) return '';
    try {
      return hljs.highlight(raw, { language: lang, ignoreIllegals: true }).value;
    } catch {
      return hljs.highlightAuto(raw).value;
    }
  });
  ```
- **Features**:
  - One-click "Copy Code" button with animated checkmark and 2-second timeout feedback.
  - Line numbers column aligned with code lines.
  - Code snippet title bar with file icon, language badge, and copy button.
  - Custom dark syntax theme matching application palette (`src/styles/_highlight-theme.scss`).

---

#### Component 2: `OutputConsoleComponent` (`app-output-console`)
- **File**: `src/app/shared/components/output-console/output-console.component.ts`
- **Purpose**: Real-time logging console for Observable emissions, errors, and lifecycle events.
- **Data Models**:
  ```typescript
  export type ConsoleEntryType = 'next' | 'error' | 'complete' | 'subscribe' | 'unsubscribe' | 'info';

  export interface ConsoleEntry {
    id: string;
    timestamp: number;        // Epoch millis
    relativeMs: number;       // +42ms relative to stream execution start
    type: ConsoleEntryType;
    streamName?: string;      // e.g., "Source$", "Inner$", "Flattened$"
    value?: any;              // Emitted value (primitive, object, array)
    description?: string;
  }
  ```
- **Inputs**:
  ```typescript
  title = input<string>('Live Stream Output');
  entries = input<ConsoleEntry[]>([]);
  isStreaming = input<boolean>(false);               // Pulsing live indicator
  maxEntries = input<number>(200);
  autoScroll = input<boolean>(true);
  showTimestamps = input<boolean>(true);
  filterStream = input<string | null>(null);
  ```
- **Outputs**:
  ```typescript
  clear = output<void>();                            // Clear console event
  pause = output<boolean>();                          // Toggle pause
  replay = output<void>();                           // Replay scenario
  ```
- **Features**:
  - Color-coded badges per event type:
    - `next`: Emerald pill with value
    - `error`: Rose pill with error message
    - `complete`: Purple pill with completion symbol `|`
    - `subscribe`: Blue pill
    - `unsubscribe`: Muted gray pill
  - Object/JSON tree formatter with expandable nodes for complex nested payloads.
  - Action toolbar: Clear, Pause/Resume, Copy All Logs, and Filter by stream.
  - Animated pulsing status dot (`Live Running` / `Stream Idle` / `Completed`).

---

#### Component 3: `MarbleDiagramComponent` (`app-marble-diagram`)
- **File**: `src/app/shared/components/marble-diagram/marble-diagram.component.ts`
- **Purpose**: Interactive SVG marble diagrams rendering input streams, operator transformation box, and output stream, complete with animated playhead.
- **Data Models**:
  ```typescript
  export interface MarbleEmission {
    id: string;
    timeMs: number;              // 0 to durationMs
    value: string | number | any;// Emission payload
    displayLabel: string;        // Text inside circle (e.g., "1", "A", "🍎")
    color?: string;              // Hex color or token variable
    shape?: 'circle' | 'square' | 'diamond';
  }

  export interface MarbleStream {
    id: string;
    label: string;               // e.g. "Source Stream (interval)"
    color?: string;
    emissions: MarbleEmission[];
    completedAtMs?: number;      // Completion tick '|'
    errorAtMs?: number;          // Error tick 'X'
  }
  ```
- **Inputs**:
  ```typescript
  inputStreams = input.required<MarbleStream[]>();   // 1 or more input streams
  operatorName = input<string>('');                  // e.g. "map(x => x * 10)" or "switchMap(...)"
  outputStream = input<MarbleStream | null>(null);   // Derived stream
  durationMs = input<number>(5000);                  // Total timeline length
  interactive = input<boolean>(true);                // Click/drag to reposition or add marbles
  isPlaying = input<boolean>(false);
  playbackSpeed = input<number>(1);
  ```
- **Outputs**:
  ```typescript
  marbleClick = output<{ streamId: string; emission: MarbleEmission }>();
  timelineClick = output<{ streamId: string; timeMs: number }>();
  emissionChange = output<{ streamId: string; emissions: MarbleEmission[] }>();
  playToggle = output<boolean>();
  ```
- **SVG Coordinate Architecture**:
  - ViewBox: `0 0 800 (120 + inputStreams.length * 70)`
  - Coordinate function: `x = PADDING_LEFT + (timeMs / durationMs) * TIMELINE_WIDTH`
  - SVG elements:
    - Base timeline axis: `<line stroke="var(--color-border-strong)" stroke-width="2" marker-end="url(#arrowhead)" />`
    - Marble circle: `<circle [attr.cx]="x" [attr.cy]="y" r="14" [attr.fill]="color" />`
    - Marble text: `<text [attr.x]="x" [attr.y]="y" text-anchor="middle" dominant-baseline="central">{{ label }}</text>`
    - Completion marker: `<line [attr.x1]="compX" [attr.y1]="y-16" [attr.x2]="compX" [attr.y2]="y+16" stroke="var(--color-marble-complete)" stroke-width="4" />`
    - Error marker: `<path [attr.d]="'M ' + (errX-10) + ' ' + (y-10) + ' L ' + (errX+10) + ' ' + (y+10) + ' M ' + (errX+10) + ' ' + (y-10) + ' L ' + (errX-10) + ' ' + (y+10)'" stroke="var(--color-danger)" stroke-width="4" />`
    - Operator box: Centered `<rect rx="8" />` with operator signature text.
    - Playhead scrubber: Vertical glowing bar moving linearly across time with drag scrub support.

---

#### Component 4: `OperatorCardComponent` (`app-operator-card`)
- **File**: `src/app/shared/components/operator-card/operator-card.component.ts`
- **Data Models**:
  ```typescript
  export type OperatorCategory = 'Creation' | 'Transformation' | 'Filtering' | 'Combination' | 'Multicasting' | 'Utility' | 'Error Handling';

  export interface OperatorMetadata {
    name: string;                                   // e.g. "switchMap"
    category: OperatorCategory;
    signature: string;                              // TypeScript function signature
    summary: string;                                // 1-line description
    description: string;                            // In-depth explanation
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    useCases: string[];                             // Practical real-world applications
    pitfalls?: string[];                            // Common gotchas / memory leak warnings
    marbleRules?: string[];                         // Behavioral rules
    relatedOperators?: string[];                    // e.g. ["mergeMap", "concatMap", "exhaustMap"]
    docUrl?: string;
  }
  ```
- **Inputs**:
  ```typescript
  operator = input.required<OperatorMetadata>();
  showPlaygroundLink = input<boolean>(true);
  compact = input<boolean>(false);
  ```
- **Outputs**:
  ```typescript
  navigate = output<string>();                       // Navigate to playground
  ```
- **Features**:
  - Color-coded Category Badge (Transformation = Cyan, Filtering = Orange, Combination = Indigo, etc.).
  - Difficulty Pill (Beginner = Green, Intermediate = Yellow, Advanced = Purple).
  - Clean monospace signature card with copy button.
  - Bulleted use cases with check icons and pitfalls with alert icons.
  - Clickable related operator tags.

---

#### Component 5: `ComparisonTableComponent` (`app-comparison-table`)
- **File**: `src/app/shared/components/comparison-table/comparison-table.component.ts`
- **Data Models**:
  ```typescript
  export interface ComparisonFeature {
    id: string;
    label: string;
    description?: string;
  }

  export interface ComparisonItem {
    id: string;
    name: string;
    badge?: string;
    recommendedUse: string;
    characteristics: Record<string, { text: string; status?: 'positive' | 'neutral' | 'negative' }>;
  }

  export interface ComparisonData {
    features: ComparisonFeature[];
    items: ComparisonItem[];
  }
  ```
- **Inputs**:
  ```typescript
  data = input.required<ComparisonData>();
  highlightColumnId = input<string | null>(null);
  ```
- **Features**:
  - Sticky first column (feature descriptions) with horizontal scroll on mobile.
  - Semantic status indicators (`positive`: green checkmark, `neutral`: gray circle, `negative`: amber alert).
  - Highlighting for selected operator to easily compare against neighbors.

---

#### Component 6: `PlaygroundWrapperComponent` (`app-playground-wrapper`)
- **File**: `src/app/shared/components/playground-wrapper/playground-wrapper.component.ts`
- **Purpose**: Standard tabbed harness hosting Concept, Code, Visual Demo, Comparison, and Quiz for every educational topic.
- **Data Models**:
  ```typescript
  export type PlaygroundTab = 'concept' | 'code' | 'visual' | 'comparison' | 'quiz';

  export interface PlaygroundTabItem {
    id: PlaygroundTab;
    label: string;
    icon?: string;
    badge?: string;
  }
  ```
- **Inputs & Models**:
  ```typescript
  title = input.required<string>();
  subtitle = input<string>('');
  category = input<string>('');
  difficulty = input<'beginner' | 'intermediate' | 'advanced'>('beginner');
  topicId = input<string>('');
  availableTabs = input<PlaygroundTab[]>(['concept', 'code', 'visual', 'comparison', 'quiz']);
  activeTab = model<PlaygroundTab>('concept');
  ```
- **Content Slots (Projection)**:
  - `<ng-content select="[slot=concept]" />`
  - `<ng-content select="[slot=code]" />`
  - `<ng-content select="[slot=visual]" />`
  - `<ng-content select="[slot=comparison]" />`
  - `<ng-content select="[slot=quiz]" />`
- **Features**:
  - Tab header with smooth active indicator and keyboard navigation (Left/Right arrows).
  - Topic completion toggle button (marks completed in `ProgressService` with celebration feedback).
  - Consistent layout header with topic title, badge, breadcrumb, and quick action buttons.

---

#### Component 7: `QuizBlockComponent` (`app-quiz-block`)
- **File**: `src/app/shared/components/quiz-block/quiz-block.component.ts`
- **Data Models**:
  ```typescript
  export interface QuizOption {
    id: string;
    text: string;
    codeSnippet?: string;
  }

  export interface QuizQuestion {
    id: string;
    question: string;
    codeSnippet?: string;
    options: QuizOption[];
    correctOptionId: string;
    explanation: string;
  }

  export interface QuizScore {
    total: number;
    correct: number;
    percentage: number;
    passed: boolean;
  }
  ```
- **Inputs**:
  ```typescript
  questions = input.required<QuizQuestion[]>();
  topicId = input<string>('');
  passThreshold = input<number>(75);
  ```
- **Outputs**:
  ```typescript
  completed = output<QuizScore>();
  ```
- **Internal Signals**:
  ```typescript
  currentIndex = signal<number>(0);
  selectedOption = signal<string | null>(null);
  isAnswerSubmitted = signal<boolean>(false);
  answers = signal<Record<number, { selectedId: string; isCorrect: boolean }>>({});
  isQuizCompleted = signal<boolean>(false);
  score = computed<QuizScore>(() => ...);
  ```
- **Features**:
  - Interactive radio option selection with immediate feedback upon "Submit Answer".
  - Green border and check icon for correct choice, Red border and cross icon for incorrect choice.
  - Detailed explanation card shown immediately after submission.
  - Question pagination dots (`Question 2 of 4`).
  - Completion summary banner with "Retry Quiz" and auto-completion sync with `ProgressService`.

---

### 3.5 Modern Angular 20 API Patterns
1. **Dependency Injection**:
   Use `inject()` directly in properties:
   ```typescript
   private readonly http = inject(HttpClient);
   private readonly destroyRef = inject(DestroyRef);
   private readonly progressService = inject(ProgressService);
   ```
2. **Signals & Two-Way Models**:
   - `input()` / `input.required()` for component inputs.
   - `output<T>()` for component events.
   - `model<T>()` for two-way state (e.g. `activeTab`).
   - `computed()` for pure derived values.
3. **RxJS Subscription Lifecycle Teardown**:
   - Replace old `takeUntil(this.destroy$)` with `takeUntilDestroyed(this.destroyRef)`:
     ```typescript
     source$.pipe(
       takeUntilDestroyed(this.destroyRef)
     ).subscribe(val => { ... });
     ```
4. **Data Fetching with `resource()` / `rxResource()`**:
   - Use `rxResource` from `@angular/core/rxjs-interop` for asynchronous server requests:
     ```typescript
     import { rxResource } from '@angular/core/rxjs-interop';

     selectedDelay = signal<number>(2000);

     slowResource = rxResource({
       request: () => ({ delay: this.selectedDelay() }),
       loader: ({ request }) => this.http.get<SlowApiResponse>(`/api/slow?delay=${request.delay}`)
     });
     ```
5. **Zoneless Readiness**:
   - Never rely on `NgZone.run()`.
   - Update signals directly; Angular's zoneless scheduler handles optimal rendering.

---

### 3.6 Express Server API Extension Specifications (R2)

#### Existing Routes (Preserved):
1. `GET /api/courses/:id` (`server/get-course.route.ts`): Returns course metadata + associated lessons.
2. `PUT /api/courses/:id` (`server/save-course-route.ts`): Updates course details.
3. `GET /api/lessons` (`server/search-lessons.route.ts`): Search, filter, paginate lessons.
4. `GET /` (`server/server.ts`): Healthcheck and endpoint catalog.

#### New Route 1: `GET /api/slow?delay=2000`
- **File**: `server/slow.route.ts`
- **Purpose**: Simulate delayed HTTP requests for flattening operators (`switchMap`, `mergeMap`, `concatMap`, `exhaustMap`), race conditions, cancellation, and progress indicators.
- **Query Parameters**:
  - `delay` (number, optional, default: 2000, bounds: [0, 15000]): Delay in milliseconds.
  - `tag` (string, optional): Client identifier to trace request ordering.
- **Response Format (200 OK)**:
  ```json
  {
    "status": "success",
    "endpoint": "/api/slow",
    "delay": 2000,
    "tag": "search-query-1",
    "requestTimestamp": 1730841230000,
    "responseTimestamp": 1730841232000,
    "elapsedMs": 2004,
    "data": {
      "message": "Response delivered successfully after 2000ms delay",
      "serverTime": "2026-11-05T21:05:00.000Z"
    }
  }
  ```
- **Implementation Code**:
  ```typescript
  import { Request, Response } from 'express';

  interface SlowQueryParams {
    delay?: string;
    tag?: string;
  }

  export function slowResponse(req: Request<unknown, unknown, unknown, SlowQueryParams>, res: Response) {
    const rawDelay = Number(req.query.delay ?? 2000);
    const delayMs = Math.min(Math.max(isNaN(rawDelay) ? 2000 : rawDelay, 0), 15000);
    const tag = req.query.tag ?? 'default';
    const requestTimestamp = Date.now();

    setTimeout(() => {
      const responseTimestamp = Date.now();
      res.status(200).json({
        status: 'success',
        endpoint: '/api/slow',
        delay: delayMs,
        tag,
        requestTimestamp,
        responseTimestamp,
        elapsedMs: responseTimestamp - requestTimestamp,
        data: {
          message: `Response delivered successfully after ${delayMs}ms delay`,
          serverTime: new Date(responseTimestamp).toISOString()
        }
      });
    }, delayMs);
  }
  ```

#### New Route 2: `GET /api/simulate-error?rate=0.3`
- **File**: `server/simulate-error.route.ts`
- **Purpose**: Simulate intermittent server failures with configurable error rate to demonstrate `retry`, `retryWhen`, `catchError`, exponential backoff, and fallback UI.
- **Query Parameters**:
  - `rate` (number, optional, default: 0.3, bounds: [0.0, 1.0]): Probability of failure.
  - `delay` (number, optional, default: 0, bounds: [0, 10000]): Pre-response delay.
  - `statusCode` (number, optional, default: 500): HTTP error code to return on failure.
  - `attempt` (number, optional): Client attempt counter for retry logging.
- **Response Format (Success - 200 OK)**:
  ```json
  {
    "status": "success",
    "endpoint": "/api/simulate-error",
    "rate": 0.3,
    "randomRoll": 0.7421,
    "attempt": 2,
    "timestamp": 1730841234000,
    "message": "Request succeeded (roll 0.7421 >= failure threshold 0.3000)",
    "data": {
      "service": "PaymentGateway",
      "payload": "Transaction authorized successfully"
    }
  }
  ```
- **Response Format (Failure - 500 Internal Server Error)**:
  ```json
  {
    "status": "error",
    "endpoint": "/api/simulate-error",
    "statusCode": 500,
    "rate": 0.3,
    "randomRoll": 0.1843,
    "attempt": 1,
    "code": "SIMULATED_TRANSIENT_ERROR",
    "message": "Simulated upstream service error (roll 0.1843 < failure threshold 0.3000)",
    "timestamp": 1730841234000,
    "suggestedAction": "Retry request using exponential backoff"
  }
  ```
- **Implementation Code**:
  ```typescript
  import { Request, Response } from 'express';

  interface SimulateErrorQueryParams {
    rate?: string;
    delay?: string;
    statusCode?: string;
    attempt?: string;
  }

  export function simulateError(req: Request<unknown, unknown, unknown, SimulateErrorQueryParams>, res: Response) {
    const rawRate = Number(req.query.rate ?? 0.3);
    const rate = Math.min(Math.max(isNaN(rawRate) ? 0.3 : rawRate, 0.0), 1.0);
    const rawDelay = Number(req.query.delay ?? 0);
    const delayMs = Math.min(Math.max(isNaN(rawDelay) ? 0 : rawDelay, 0), 10000);
    const statusCode = Number(req.query.statusCode ?? 500) || 500;
    const attempt = Number(req.query.attempt ?? 1) || 1;

    const handleExecution = () => {
      const roll = Math.random();
      const isFailure = roll < rate;
      const timestamp = Date.now();

      if (isFailure) {
        res.status(statusCode).json({
          status: 'error',
          endpoint: '/api/simulate-error',
          statusCode,
          rate,
          randomRoll: Number(roll.toFixed(4)),
          attempt,
          code: 'SIMULATED_TRANSIENT_ERROR',
          message: `Simulated upstream service error (roll ${roll.toFixed(4)} < failure threshold ${rate.toFixed(4)})`,
          timestamp,
          suggestedAction: 'Retry request using exponential backoff'
        });
      } else {
        res.status(200).json({
          status: 'success',
          endpoint: '/api/simulate-error',
          rate,
          randomRoll: Number(roll.toFixed(4)),
          attempt,
          timestamp,
          message: `Request succeeded (roll ${roll.toFixed(4)} >= failure threshold ${rate.toFixed(4)})`,
          data: {
            service: 'OperationalDataStream',
            payload: 'Transaction authorized successfully'
          }
        });
      }
    };

    if (delayMs > 0) {
      setTimeout(handleExecution, delayMs);
    } else {
      handleExecution();
    }
  }
  ```

#### Updated `server/server.ts` Integration:
```typescript
import express from 'express';
import cors from 'cors';
import { getCourse } from './get-course.route';
import { saveCourse } from './save-course-route';
import { searchLessons } from './search-lessons.route';
import { slowResponse } from './slow.route';
import { simulateError } from './simulate-error.route';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.status(200).json({
    message: 'REST API is running',
    endpoints: [
      'GET /api/courses/:id',
      'PUT /api/courses/:id',
      'GET /api/lessons',
      'GET /api/slow?delay=2000',
      'GET /api/simulate-error?rate=0.3'
    ],
  });
});

app.get('/api/courses/:id', getCourse);
app.put('/api/courses/:id', saveCourse);
app.get('/api/lessons', searchLessons);
app.get('/api/slow', slowResponse);
app.get('/api/simulate-error', simulateError);

const port = Number(process.env['PORT'] ?? 9000);

app.listen(port, () => {
  console.log(`REST API running on http://localhost:${port}`);
});
```

---

## 4. Caveats
1. **Network Connectivity for Fonts**: Google Fonts Inter and JetBrains Mono are loaded via Google Fonts CDN in `src/index.html`. In an offline environment, system fallbacks (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto` for sans, `'Courier New', monospace` for mono) defined in `--font-sans` and `--font-mono` will activate automatically.
2. **Highlight.js Installation Required**: Before running the build with `CodeBlockComponent`, `npm install highlight.js` must be executed.
3. **SVG Coordinate Boundaries**: The SVG marble diagram uses a dynamic viewBox calculation based on the count of active input streams. For scenarios with 3+ simultaneous streams (e.g. `combineLatest(a$, b$, c$)`), vertical padding must dynamically allocate 70px per stream to prevent label overlap.
4. **Zoneless Change Detection**: Any manual timer/timeout outside Angular's signals (e.g. in SVG animation frames) should update an Angular Signal (`signal.set(...)`) so the zoneless scheduler automatically renders the frame.

---

## 5. Conclusion
- The architectural specifications for Requirements R1 and R2 are fully defined, complete, and tailored to Angular 20 and Express 5.
- Zero external UI libraries are needed; the hand-crafted SCSS token hierarchy provides a full dark theme, responsive grid shell, and interactive styling.
- The 7 standalone shared components provide clean, decoupled interfaces with typed inputs/outputs/signals, ready to serve Modules 1 through 8.
- The Express server extensions (`GET /api/slow` and `GET /api/simulate-error`) preserve all existing routes and supply the exact configurable network behaviors needed for educational flattening and resilience demos.

---

## 6. Verification Method

### 6.1 Build & Static Check Verification
1. Install highlight.js:
   ```bash
   npm install highlight.js
   ```
2. Run development build:
   ```bash
   npx ng build --configuration development
   ```
   **Expected**: Code 0 exit, bundle completes without syntax or SCSS errors.

### 6.2 Express Server Route Verification
1. Start Express server:
   ```bash
   npm run server
   ```
2. Verify root route:
   ```bash
   curl http://localhost:9000/
   ```
   **Expected**: JSON containing all 5 registered endpoints.
3. Verify existing route:
   ```bash
   curl http://localhost:9000/api/courses/1
   ```
   **Expected**: Status 200 with course 1 and its lessons.
4. Verify `/api/slow`:
   ```bash
   curl "http://localhost:9000/api/slow?delay=500"
   ```
   **Expected**: Status 200 with ~500ms elapsed time and status `"success"`.
5. Verify `/api/simulate-error`:
   ```bash
   curl "http://localhost:9000/api/simulate-error?rate=1.0"
   ```
   **Expected**: Status 500 with `"status": "error"`, code `"SIMULATED_TRANSIENT_ERROR"`.
   ```bash
   curl "http://localhost:9000/api/simulate-error?rate=0.0"
   ```
   **Expected**: Status 200 with `"status": "success"`.
