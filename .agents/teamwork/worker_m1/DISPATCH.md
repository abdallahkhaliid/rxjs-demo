# DISPATCH — Worker: Milestone 1 (Shell, Design System, Shared Components & Express APIs)

## Role
Implementation Worker (Milestone 1)

## Working Directory
c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\worker_m1\

## Authoritative Inputs
- User Request: `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\ORIGINAL_REQUEST.md`
- Master Project Specification: `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\PROJECT.md`
- Explorer Survey 1 Report: `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\explorer_survey_1\handoff.md`
- Explorer Survey 2 Report: `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\explorer_survey_2\handoff.md`

## Write Ownership
- `package.json` (install highlight.js)
- `src/index.html` (Google fonts CDN links)
- `src/styles/**` (_tokens.scss, _reset.scss, _typography.scss, _components.scss, _highlight-theme.scss, styles.scss)
- `src/app/app.config.ts` (provideHttpClient(withFetch()))
- `src/app/app.routes.ts` (root routes, shell host, lazy route stubs for 8 modules)
- `src/app/app.ts`, `src/app/app.html`, `src/app/app.scss` (root host)
- `src/app/core/layout/**` (Shell, Topbar, Sidenav, Breadcrumbs)
- `src/app/core/services/**` (ProgressService, SearchService, LessonsService)
- `src/app/shared/components/**` (code-block, output-console, marble-diagram, operator-card, comparison-table, playground-wrapper, quiz-block)
- `server/**` (slow.route.ts, simulate-error.route.ts, search-lessons.route.ts patch, server.ts route mount)

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Tasks
1. Execute `npm install highlight.js` to add highlight.js to dependencies.
2. In `src/index.html`, add preconnect and Google Fonts link for `Inter` and `JetBrains Mono`.
3. In `src/app/app.config.ts`, add `provideHttpClient(withFetch())`.
4. In `src/styles/`, create the complete dark theme SCSS token system, reset, typography, and highlight theme as specified in `explorer_survey_2/handoff.md`.
5. In `src/app/shared/components/`, build the 7 standalone components using Angular 20 APIs (`inject()`, `takeUntilDestroyed()`, `DestroyRef`, signals, `resource()`, zoneless):
   - `code-block`
   - `output-console`
   - `marble-diagram`
   - `operator-card`
   - `comparison-table`
   - `playground-wrapper`
   - `quiz-block`
6. In `src/app/core/`, build:
   - `layout/`: `shell`, `topbar`, `sidenav`, `breadcrumbs`
   - `services/`: `progress.service.ts` (localStorage progress tracking), `search.service.ts`, `lessons.service.ts`
7. In `server/`:
   - Implement `server/slow.route.ts` (`GET /api/slow?delay=2000`)
   - Implement `server/simulate-error.route.ts` (`GET /api/simulate-error?rate=0.3`)
   - In `server/search-lessons.route.ts`, fix filter to allow searching without courseId: `(!req.query.courseId || isNaN(courseId) || lesson.courseId === courseId)`
   - Register routes in `server/server.ts`
8. In `src/app/app.routes.ts`: configure shell layout route hosting lazy routes stubs for Modules 1-8. Replace boilerplate `src/app/app.html` with `<router-outlet />`.
9. Run verification commands:
   - `npx ng build --configuration development` -> MUST pass with zero compilation errors!
   - Express server tests: test `/api/slow` and `/api/simulate-error` with curl/ts-node.
10. Write your handoff report to `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\worker_m1\handoff.md`.
