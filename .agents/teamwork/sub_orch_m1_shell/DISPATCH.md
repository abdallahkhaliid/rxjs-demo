# DISPATCH — Sub-Orchestrator: Milestone 1 (Shell, Design System & Express APIs)

## Role
Milestone 1 Sub-Orchestrator

## Working Directory
c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\sub_orch_m1_shell\

## Authoritative Inputs
- User Request: `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\ORIGINAL_REQUEST.md`
- Master Project Specification: `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\PROJECT.md`
- Explorer Survey 1 Report: `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\explorer_survey_1\handoff.md`
- Explorer Survey 2 Report: `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\explorer_survey_2\handoff.md`

## Mission & Scope
Deliver Milestone 1 (Shell Layout, Dark Theme Design System, Shared Interactive Components & Express APIs):
1. **Dependencies & Setup**:
   - Install `highlight.js` via `npm install highlight.js`.
   - Add Google Fonts CDN (`Inter` and `JetBrains Mono`) to `src/index.html`.
   - Register `provideHttpClient(withFetch())` in `src/app/app.config.ts`.
2. **SCSS Design System**:
   - Implement hand-crafted dark theme token hierarchy in `src/styles/` (`_tokens.scss`, `_reset.scss`, `_typography.scss`, `_components.scss`, `_highlight-theme.scss`, `styles.scss`). No external UI libraries.
3. **Shared Standalone Interactive Components** (in `src/app/shared/components/`):
   - `code-block` (highlight.js syntax highlighting, copy button, line numbers)
   - `output-console` (live stream emissions, timestamps, color badges, clear, pause)
   - `marble-diagram` (interactive SVG marble animations, scrubber, completion/error markers)
   - `operator-card` (metadata, signature, use cases, category badge, pitfalls)
   - `comparison-table` (tabulated feature comparisons)
   - `playground-wrapper` (Concept, Code, Visual Demo, Comparison, Quiz tabs)
   - `quiz-block` (interactive questions with instant feedback, explanations, score)
   - Adhere strictly to Angular 20 APIs (`inject()`, `takeUntilDestroyed()`, `DestroyRef`, signals, `resource()`, zoneless).
4. **Shell Layout Architecture** (in `src/app/core/layout/`):
   - `ShellComponent`
   - `TopbarComponent`
   - `SidenavComponent` (navigation structure for all 8 modules)
   - `BreadcrumbsComponent`
   - Route structure in `src/app/app.routes.ts` connecting Shell with lazy route stubs for all 8 modules.
5. **Express API Extensions** (in `server/`):
   - Add `server/slow.route.ts` (`GET /api/slow?delay=2000`).
   - Add `server/simulate-error.route.ts` (`GET /api/simulate-error?rate=0.3`).
   - Patch `server/search-lessons.route.ts` to make `courseId` optional for autocomplete search.
   - Update `server/server.ts` to mount new endpoints.
6. **Execution & Gate Review**:
   - Follow the Project sub-orchestrator pattern (Explorer -> Worker -> Reviewer -> Challenger -> Auditor gate loop).
   - Ensure `npx ng build --configuration development` passes with code 0.
   - Ensure all Express endpoints respond correctly.
   - Deliver full handoff report in your working directory and notify the Project Orchestrator upon completion.
