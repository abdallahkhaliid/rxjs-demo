# RxJS Learning Platform — Test Infrastructure Specification (`TEST_INFRA.md`)

## 1. Overview & Architecture

The **RxJS Learning Platform Test Infrastructure** provides an opaque-box, requirement-driven end-to-end testing framework engineered to validate all 52 functional features across all 6 project milestones (M1–M6).

### Key Architectural Tenets
1. **Opaque-Box Requirement Verification**: Tests interact strictly with public contracts, HTTP API endpoints, data stores, and RxJS observable pipelines. No implementation internals or private Angular symbols are referenced.
2. **Deterministic & Cross-Platform Execution**: Engineered for zero-dependency execution across Node.js environments (Windows, Linux, macOS), handling platform-specific timer granularities and microtask scheduling without flaky time races.
3. **Progressive Testability**: Decoupled execution allows testing any single milestone (e.g. `--milestone M1`), tier (`--tier 1`), or feature (`--feature F43`) independently during milestone development.
4. **Authoritative Specification & Oracle**: Validated directly against **RxJS 7.8 runtime behavior** and project requirements defined in `PROJECT.md`, `SCOPE.md`, and `ORIGINAL_REQUEST.md`.

---

## 2. Directory Layout & Organization

All test infrastructure, assertions, suites, and runners reside under `tests/`:

```
tests/
├── tsconfig.e2e.json                  # TypeScript compiler settings for E2E tests
└── e2e/
    ├── harness/
    │   ├── assert.js                  # Assertion engine (expect, toBe, toEqual, toThrow, rejects, etc.)
    │   └── runner-core.js             # Test runner core, CLI parser, test registry, reporting
    ├── tier1-features/                # Tier 1: Primary Feature Coverage (260 tests, 5 per feature)
    │   ├── t1-shell-design-api.js                 # Features 01–15 (Milestone 1)
    │   ├── t1-fundamentals.js                     # Features 16–22 (Milestone 2)
    │   ├── t1-creation-operators.js               # Features 23–30 (Milestone 2)
    │   ├── t1-category-operators.js               # Features 31–35 (Milestone 3)
    │   ├── t1-hoo-subjects-schedulers.js          # Features 36–38 (Milestone 4)
    │   ├── t1-angular-mini-projects.js            # Features 39–48 (Milestone 5)
    │   └── t1-polish-navigation-acceptance.js     # Features 49–52 (Milestone 6)
    ├── tier2-boundaries/              # Tier 2: Boundary, Corner Cases & Stress (260 tests, 5 per feature)
    │   ├── t2-shell-design-api-boundaries.js      # Features 01–15 (Milestone 1)
    │   ├── t2-fundamentals-boundaries.js          # Features 16–22 (Milestone 2)
    │   ├── t2-creation-operators-boundaries.js    # Features 23–30 (Milestone 2)
    │   ├── t2-category-operators-boundaries.js    # Features 31–35 (Milestone 3)
    │   ├── t2-hoo-subjects-schedulers-boundaries.js # Features 36–38 (Milestone 4)
    │   ├── t2-angular-mini-projects-boundaries.js # Features 39–48 (Milestone 5)
    │   └── t2-polish-navigation-acceptance-boundaries.js # Features 49–52 (Milestone 6)
    ├── tier3-combinations/            # Tier 3: Cross-Feature & Pairwise Module Interactions (15 tests)
    │   └── t3-cross-feature-interactions.js       # Cross-feature pipelines (M1–M6)
    ├── tier4-scenarios/               # Tier 4: Real-World Application Workflows (8 tests)
    │   └── t4-real-world-scenarios.js             # Full end-to-end user journeys (Mini-projects & workflows)
    ├── run-all-tests.js               # Node.js master entry point executable
    └── runner.ts                      # TypeScript master entry point executable
```

---

## 3. Test Runner CLI Usage

The master test runner supports both Node.js direct execution and `ts-node` invocation.

### 3.1 Primary Commands

```bash
# Run the complete test suite (all 543 tests across Tiers 1-4)
node tests/e2e/run-all-tests.js

# Alternative via ts-node
npx ts-node -P tests/tsconfig.e2e.json tests/e2e/runner.ts
```

### 3.2 CLI Options & Flags

| Flag | Argument | Description | Example |
|---|---|---|---|
| `--tier`, `--tier=` | Number (`1`, `2`, `3`, `4`) | Filter execution to specific tier(s) | `node tests/e2e/run-all-tests.js --tier 1` |
| `--milestone`, `--milestone=` | String (`M1`–`M6`) | Filter execution to specific milestone(s) | `node tests/e2e/run-all-tests.js --milestone M5` |
| `--feature`, `--feature=` | String or Number (`F43`, `43`) | Filter execution to specific feature ID | `node tests/e2e/run-all-tests.js --feature F43` |
| `--filter`, `--filter=` | Regex string | Match test names or categories | `node tests/e2e/run-all-tests.js --filter "Search"` |
| `--verbose`, `-v` | None | Print detailed test name and duration per test | `node tests/e2e/run-all-tests.js --verbose` |
| `--bail`, `-b` | None | Abort immediately on the first test failure | `node tests/e2e/run-all-tests.js --bail` |
| `--json` | None | Output machine-readable JSON summary for CI | `node tests/e2e/run-all-tests.js --json` |
| `--help`, `-h` | None | Display CLI usage reference | `node tests/e2e/run-all-tests.js --help` |

### 3.3 Combinations & Practical Workflows

```bash
# Test Milestone 1 only during initial scaffolding:
node tests/e2e/run-all-tests.js --milestone M1

# Test Tier 2 boundary conditions for Higher-Order Observables:
node tests/e2e/run-all-tests.js --tier 2 --milestone M4

# Test Feature 43 (Search Autocomplete) across all tiers with verbose logging:
node tests/e2e/run-all-tests.js --feature F43 --verbose

# Run real-world scenarios only:
node tests/e2e/run-all-tests.js --tier 4
```

---

## 4. Test Tiers Specification

### Tier 1: Core Feature Coverage (260 Tests)
- **Requirement**: Exactly 5 test cases per feature for all 52 features ($5 \times 52 = 260$ tests).
- **Scope**: Happy paths, primary behaviors, interface contract validation, standard input/output mapping, and nominal asynchronous emission flows.
- **Milestone Breakdown**:
  - Milestone 1 (F01–F15): 75 tests
  - Milestone 2 (F16–F30): 75 tests
  - Milestone 3 (F31–F35): 25 tests
  - Milestone 4 (F36–F38): 15 tests
  - Milestone 5 (F39–F48): 50 tests
  - Milestone 6 (F49–F52): 20 tests

### Tier 2: Boundary, Corner Cases & Stress Integrity (260 Tests)
- **Requirement**: Exactly 5 test cases per feature for all 52 features ($5 \times 52 = 260$ tests).
- **Scope**:
  - Null/undefined/empty collections, zero-duration timers, rapid burst emissions.
  - Error routing, synchronous and asynchronous exception propagation (`catchError`, retry limits).
  - Unsubscription cleanup, memory leak prevention, multiple independent subscriptions.
  - Stress testing with large datasets ($N \ge 1,000$ items) and edge cases in RxJS operators (e.g. `ReplaySubject(0)`, `shareReplay` reset on error, empty streams in `reduce`/`forkJoin`).
- **Milestone Breakdown**: Same distribution as Tier 1 (260 tests).

### Tier 3: Cross-Feature & Pairwise Module Interactions (15 Tests)
- **Requirement**: Multi-feature end-to-end integration across subsystems.
- **Scope**:
  - `T3.01`: F04 Shell + F50 Command Palette navigation.
  - `T3.02`: F05 CodeBlock + F06 OutputConsole + F10 Playground code execution pipeline.
  - `T3.03`: F08 OperatorCard + F07 MarbleDiagram + F09 ComparisonTable synchronized display.
  - `T3.04`: F11 QuizBlock + F49 ProgressTracking reactive score persistence.
  - `T3.05`: F15 HttpClient + F12 /api/slow + F13 /api/simulate-error resilience.
  - `T3.06`: F18 Pipe + F31 Transformation + F32 Filtering composite stream transformation.
  - `T3.07`: F23 Creation Operators + F33 Combination multi-source aggregation.
  - `T3.08`: F36 Higher-Order Observables + F34 Utility stream inspection and lifecycle.
  - `T3.09`: F37 Dynamic Subjects + F35 Multicasting state broadcasting.
  - `T3.10`: F38 Schedulers + F19 Cold vs Hot Observable execution timing.
  - `T3.11`: F42 Store + F39 HttpPatterns + F41 Lifecycle auto-cleanup.
  - `T3.12`: F40 Reactive Forms + F48 Multi-Step Wizard validation pipeline.
  - `T3.13`: F43 Autocomplete + F47 Polling concurrent network coordinator.
  - `T3.14`: F44 Live Dashboard + F45 Shopping Cart + F46 Request Manager event pipeline.
  - `T3.15`: F49 Progress + F50 Command Palette + F51 Keyboard Navigation mastery workflow.

### Tier 4: Real-World Application Scenarios (8 Tests)
- **Requirement**: Complete user workflows and complex multi-step real-world state machines.
- **Scope**:
  - `T4.01`: Search Autocomplete End-to-End User Session (debouncing, distinct values, cancellation, error recovery).
  - `T4.02`: Live Metrics Dashboard with Pause, Resume, and Rate Throttling (buffer, windowing, aggregate computations).
  - `T4.03`: Shopping Cart Reactive State Store (optimistic updates, coupon calculation, rollback on server reject).
  - `T4.04`: HTTP Request Manager with Prioritization, Max Concurrency, and Queue Drain.
  - `T4.05`: Smart Adaptive Polling System (exponential backoff on network failures, idle-tab pause/resume).
  - `T4.06`: Multi-Step Form Wizard with Async Server-Side Validation and Step Save/Resume.
  - `T4.07`: Complete Learner Progression (login, operator playground, quiz pass, progress mark, next recommendation).
  - `T4.08`: Resilient Network Recovery Workflow (offline detection, queueing offline mutations, automatic sync on reconnect).

---

## 5. Assertion Engine Capabilities (`tests/e2e/harness/assert.js`)

The test harness provides an idiomatic, zero-dependency assertion DSL:

- `expect(actual).toBe(expected)`: Strict reference/primitive equality (`===`).
- `expect(actual).toEqual(expected)`: Deep recursive equality for objects, arrays, Maps, Sets, and Date objects.
- `expect(actual).toBeNull()` / `toBeUndefined()` / `toBeDefined()` / `toBeTruthy()` / `toBeFalsy()`
- `expect(actual).toContain(item)`: String substring search or Array inclusion.
- `expect(actual).toHaveLength(expected)`: Array or String length assertion.
- `expect(actual).toBeGreaterThan(n)` / `toBeLessThan(n)` / `toBeGreaterThanOrEqual(n)` / `toBeLessThanOrEqual(n)`
- `expect(actual).toBeCloseTo(expected, precision)`: Floating-point precision matching.
- `expect(fn).toThrow(expectedError)`: Synchronous error throwing check with type/message matching.
- `expect(promise).rejects.toThrow(expectedError)`: Asynchronous Promise rejection check.
- `expect(actual).toMatch(regex)`: Regular expression pattern match.

---

## 6. CI / CD Integration

The runner conforms to UNIX standard exit codes:
- **`0`**: All executed tests passed successfully.
- **`1`**: One or more tests failed or encountered an unhandled execution error.

In CI pipelines (e.g. GitHub Actions, GitLab CI), invoke:
```bash
node tests/e2e/run-all-tests.js --json > test-results.json
```
The resulting JSON file contains structured totals, failure stacks, and per-feature / per-milestone breakdowns for test reporting dashboards.
