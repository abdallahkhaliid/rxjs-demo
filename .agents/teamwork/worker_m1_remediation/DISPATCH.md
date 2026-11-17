# DISPATCH — Worker M1 Remediation

## Role
Implementation Worker (Milestone 1 Remediation)

## Working Directory
c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\worker_m1_remediation\

## Authoritative Inputs
- User Request: `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\ORIGINAL_REQUEST.md`
- Master Project Specification: `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\PROJECT.md`
- Challenger 1 Report: `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\challenger_m1_1\handoff.md`
- Explorer M1 Fix 1 Report: `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\explorer_m1_fix_1\handoff.md`
- Explorer M1 Fix 2 Report: `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\explorer_m1_fix_2\handoff.md`
- Explorer M1 Fix 3 Report: `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\explorer_m1_fix_3\handoff.md`
- E2E Test Writer Handoff: `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\test_writer_e2e\handoff.md`

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Remediation Tasks
1. **Fix OutputConsoleComponent Circular Reference Serialization**:
   - In `src/app/shared/components/output-console/output-console.component.ts`:
     - Inside `copyLogs()`: use `this.formatValue(e.value)` to format value strings safely, and wrap the mapping inside `try / catch`.
     - In `formatValue()`: harden with nested try/catch: `try { return String(val); } catch { return '[Unserializable Object]'; }`.
2. **Fix MarbleDiagramComponent Duration Zero Clamping**:
   - In `src/app/shared/components/marble-diagram/marble-diagram.component.ts`:
     - In `scrubberX` computed signal and `timeToX(timeMs)`: guard duration with `const duration = Math.max(this.durationMs() || 0, 1);`.
3. **Fix OperatorCardComponent Template Safety**:
   - In `src/app/shared/components/operator-card/operator-card.component.html:37`:
     - Change `@if (operator().useCases.length > 0)` to `@if (operator().useCases && operator().useCases.length > 0)`.
   - In `src/app/core/models/index.ts`: update `OperatorMetadata.useCases` to `useCases?: string[]`.
4. **Fix ComparisonTableComponent Template Safety**:
   - In `src/app/shared/components/comparison-table/comparison-table.component.html:42`:
     - Change `@let char = item.characteristics[feature.id];` to `@let char = item.characteristics ? item.characteristics[feature.id] : undefined;`.
   - In `src/app/core/models/index.ts`: update `ComparisonItem.characteristics` to `characteristics?: Record<string, ...>`.
5. **Fix LessonsService Typing**:
   - In `src/app/core/models/index.ts`: export `export type CourseWithLessons = Course & { lessons: Lesson[]; };`.
   - In `src/app/core/services/lessons.service.ts`: update `getCourse(id)` to return `Observable<CourseWithLessons>`.
6. **Verify Search Lessons Endpoint**:
   - In `server/search-lessons.route.ts`: verify that searching without `courseId` works properly across all lessons.
7. **Verification**:
   - Run `npx ng test --watch=false --browsers=ChromeHeadless` -> MUST pass 100% (all 67 unit/stress tests pass!).
   - Run `npx ng build --configuration development` -> MUST pass with code 0!
   - Run `node tests/e2e/run-all-tests.js --milestone=M1` -> MUST pass 100%!
8. Write your handoff report to `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\worker_m1_remediation\handoff.md`.
