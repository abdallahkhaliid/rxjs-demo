# DISPATCH — E2E Test Writer

## Role
E2E Test Suite Creator

## Working Directory
c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\test_writer_e2e\

## Authoritative Inputs
- User Request: `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\ORIGINAL_REQUEST.md`
- Master Project Specification: `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\PROJECT.md`
- Explorer Survey 3 Report: `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\explorer_survey_3\handoff.md`

## Write Ownership
- `tests/e2e/**` (all test files, test runner script, test specs)
- `TEST_INFRA.md` at project root
- `TEST_READY.md` at project root

## Mission & Requirements
Design and implement the complete, opaque-box, requirement-driven E2E test suite for the RxJS Learning Platform according to the 4-tier methodology:
1. **Tier 1 — Feature Coverage (>=5 per feature)**:
   - Cover all core features from `PROJECT.md § Feature Inventory` (Shell, Shared Components, Express APIs, Creation Operators, Category Operators, HOOs, Subjects, Schedulers, Angular HTTP/Forms/Lifecycle/Store, Mini-Projects).
2. **Tier 2 — Boundary & Corner Cases (>=5 per feature)**:
   - Negative values, timeouts, NaN inputs, error rates, empty arrays, stream cancellations.
3. **Tier 3 — Cross-Feature Combinations (pairwise interactions)**:
   - Combinations of operators, server errors with retry, polling with visibility change, form auto-save with HTTP put.
4. **Tier 4 — Real-World Application Scenarios**:
   - End-to-end user workflows matching the 6 mini-projects and curriculum progressions.

## Test Runner Architecture
- The test suite must be executable with a simple command, e.g. `node tests/e2e/run-all-tests.js` or `npx ts-node tests/e2e/runner.ts`.
- The runner must execute all tests across Tiers 1-4, format results with tier summaries, and exit with code 0 if all tests pass.
- Progressive testability: Provide individual tier execution flags or test filters so early milestones can verify partial progress before all modules are implemented.
- Create `TEST_INFRA.md` documenting the architecture, runner command, and coverage thresholds.
- When all test cases are implemented and runner is verified, publish `TEST_READY.md` at project root.
- Write your handoff report to `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\test_writer_e2e\handoff.md`.


## 2026-11-05T21:08:13Z
You are the E2E Test Writer for the RxJS Learning Platform project.
Scope:
1. Design and implement the opaque-box, requirement-driven E2E test suite covering all 52 features across Tiers 1-4:
   - Tier 1: Feature Coverage (>=5 per feature)
   - Tier 2: Boundary & Corner Cases (>=5 per feature)
   - Tier 3: Cross-Feature Combinations (pairwise interactions)
   - Tier 4: Real-World Application Scenarios
2. Publish TEST_INFRA.md at project root.
3. Build the test harness and test files (in `tests/e2e/`).
4. Execute and verify the test runner works cleanly.
5. Publish TEST_READY.md at project root with runner command, tier breakdown, and feature checklist.
6. When complete, send a message to the Project Orchestrator with the path to TEST_READY.md and your handoff report.
