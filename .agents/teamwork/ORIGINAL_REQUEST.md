# Original User Request

## Initial Request — 2026-11-05T20:53:00Z

Build a comprehensive, interactive RxJS Learning Platform in the existing Angular 20 project, working in parallel across phases.

Working directory: c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo
Integrity mode: development

## Requirements

### R1. Shell Layout, Design System, and Shared Interactive Components
Install highlight.js for code syntax highlighting. Implement a dark theme shell layout with sidenav and topbar using hand-crafted SCSS tokens without external UI libraries, loading Google Fonts (Inter and JetBrains Mono) via CDN. Create reusable standalone components: code-block with syntax highlighting, output-console, SVG marble diagram animations, operator-card, comparison-table, playground-wrapper (Concept, Code, Visual Demo, Comparison, Quiz), and quiz-block. All components must be standalone and lazy-loaded using Angular 20 APIs (`inject()`, `takeUntilDestroyed()`, `DestroyRef`, signals, `resource()`).

### R2. Express Server API Extension
Preserve existing Express server routes (`GET /api/courses/:id`, `PUT /api/courses/:id`, `GET /api/lessons`). Add new endpoints: `GET /api/slow?delay=2000` (configurable delay for flattening demos) and `GET /api/simulate-error?rate=0.3` (random error injection for retry demos).

### R3. Educational & Operator Modules (Modules 1 through 6)
Implement pre-wired interactive playgrounds with configurable parameters, live output console, and SVG marble diagrams across all modules:
- Module 1 (Fundamentals): what-is-rxjs, what-is-observable, observable-vs-promise, observer-subscriber, subscription-lifecycle, cold-vs-hot, multicasting
- Module 2 (Creation Operators): of(), from(), fromEvent(), interval(), timer(), range(), throwError(), defer(), EMPTY, NEVER, generate(), iif()
- Module 3 (Operator Categories): Transformation (18 operators), Filtering (19 operators), Combination (11 operators), Utility (12 operators), Multicasting (5 operators)
- Module 4 (Higher-Order Observables): Interactive comparison of switchMap, mergeMap, concatMap, and exhaustMap with animated timeline showing request lifecycle (cancelled, queued, ignored, completed)
- Module 5 (Subjects): Subject sandbox for dynamic observer subscription/unsubscription, value emission, and side-by-side comparison of Subject, BehaviorSubject, ReplaySubject, and AsyncSubject
- Module 6 (Schedulers): Execution order visualizer demos for asyncScheduler, queueScheduler, asapScheduler, and animationFrameScheduler

### R4. Angular Integration & Real-World Mini-Projects (Modules 7 and 8)
- Module 7 (RxJS in Angular): HTTP patterns against the Express server, Reactive Forms, Component Lifecycle with `takeUntilDestroyed()`, State Management with BehaviorSubject store, and advanced patterns
- Module 8 (Mini-Projects): 6 fully functional mini-projects:
  1. Search Autocomplete (hitting `GET /api/lessons?filter=...`)
  2. Live Dashboard (interval + combineLatest + scan)
  3. Shopping Cart (BehaviorSubject + scan + combineLatest)
  4. HTTP Request Manager (comparing all 4 flattening operators on the same scenario)
  5. Polling System (timer + switchMap + takeUntil + retry)
  6. Multi-Step Form (valueChanges + combineLatest + debounceTime)

### R5. Polish, Navigation, and Verification
Implement progress tracking, quizzes, global search, and keyboard navigation. Verify compilation succeeds with `npx ng build --configuration development` after each major phase. Additional automated verification suites may be included at the team's discretion.

## Acceptance Criteria

### Compilation & Build
- [ ] `npm install highlight.js` completes successfully
- [ ] `npx ng build --configuration development` passes with zero compilation errors after each major phase
- [ ] Existing Express API routes (`GET /api/courses/:id`, `PUT /api/courses/:id`, `GET /api/lessons`) and new endpoints (`GET /api/slow`, `GET /api/simulate-error`) respond correctly

### Functional Deliverables
- [ ] All 8 modules are accessible via lazy-loaded Angular routes
- [ ] Shared playground layout renders Concept, Code, Visual Demo, Comparison, and Quiz sections
- [ ] Module 4 interactive timeline demonstrates switchMap, mergeMap, concatMap, and exhaustMap request lifecycle states (cancelled, queued, ignored, completed)
- [ ] Module 5 sandbox allows dynamic subscription and value emission across Subject types (Subject, BehaviorSubject, ReplaySubject, AsyncSubject)
- [ ] Module 6 scheduler demos visualize execution order across asyncScheduler, queueScheduler, asapScheduler, and animationFrameScheduler
- [ ] Module 7 demonstrates Angular HTTP patterns, Reactive Forms, lifecycle teardown, and reactive state management
- [ ] All 6 mini-projects in Module 8 are fully interactive and functional
