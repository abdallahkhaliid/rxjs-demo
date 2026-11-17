# Milestone 3 UI, Timeline & Marble Coordinates Remediation Report

**Explorer**: `explorer_m3_fix_2`  
**Role**: Teamwork Explorer (Read-Only Investigation & Synthesis)  
**Date**: 2026-11-06T14:15:00Z  
**Target Milestone**: Milestone 3 (Module 3 Operators by Category — 65 Operators) Gate Remediation  

---

## Executive Summary

This investigation analyzed and designed the exact production remediation strategy for three interrelated UI/UX and semantic defects identified during Milestone 3 Gate Iteration 6 reviews (`reviewer_m3_1` and `challenger_m3_2`):
1. **Timeline Completion & Error Marker Position Inversion**: `operator-catalog.component.ts` hardcoded `completedAtMs` and `errorAtMs` to `Math.max(100, elapsed)`, causing synchronous emissions (spaced at 100, 200, 300, 400, 500ms) to render their completion tick `|` at t=100ms, *before* emissions 2 through 5.
2. **Visual Coordinate Collision in `takeLast`**: `filtering.data.ts:214` assigned identical timestamps `timeMs: 700` to emissions `o1` and `o2`, plus `completedAtMs: 700`, causing two SVG marbles and the completion line to occlude one another.
3. **Deprecation Callout Banners & Badges**: The 7 deprecated operators (`mapTo`, `pluck`, `repeatWhen`, `retryWhen`, `multicast`, `publish`, `refCount`) lacked typed deprecation metadata, visual badges in the operator ribbon/cards, and prominent callout banners explaining modern RxJS 7+ replacements.

Concrete, exact code proposals with before-and-after diffs, model enhancements, and automated verification suites have been formulated below for the implementing worker.

---

## 1. Observation

### Observation 1.1: Timeline Completion & Error Marker Position Inversion
- **Source File**: `src/app/features/module3-operators/operator-catalog.component.ts`
- **Lines 458–461** (`recordInputMarble`):
  ```typescript
  const elapsed = Math.max(0, Date.now() - this.streamStartTime);
  const timeMs = elapsed < 20 ? index * 100 : elapsed;
  ```
- **Lines 496–499** (`recordOutputMarble`):
  ```typescript
  const elapsed = Math.max(0, Date.now() - this.streamStartTime);
  const timeMs = elapsed < 20 ? index * 100 : elapsed;
  ```
- **Lines 482–494** (`recordInputError` and `recordInputComplete`):
  ```typescript
  private recordInputError(streamId: string): void {
    const elapsed = Math.max(100, Date.now() - this.streamStartTime);
    this.inputStreams.update(streams =>
      streams.map(s => (s.id === streamId ? { ...s, errorAtMs: elapsed } : s))
    );
  }

  private recordInputComplete(streamId: string): void {
    const elapsed = Math.max(100, Date.now() - this.streamStartTime);
    this.inputStreams.update(streams =>
      streams.map(s => (s.id === streamId ? { ...s, completedAtMs: elapsed } : s))
    );
  }
  ```
- **Lines 518–526** (`recordOutputError` and `recordOutputComplete`):
  ```typescript
  private recordOutputError(): void {
    const elapsed = Math.max(100, Date.now() - this.streamStartTime);
    this.outputMarbleStream.update(out => (out ? { ...out, errorAtMs: elapsed } : null));
  }

  private recordOutputComplete(): void {
    const elapsed = Math.max(100, Date.now() - this.streamStartTime);
    this.outputMarbleStream.update(out => (out ? { ...out, completedAtMs: elapsed } : null));
  }
  ```
- **Direct Empirical Failure**: Running `node tests/m3-challenger-semantic-audit.js`:
  ```
  [DEFECT] Synchronous stream completion marker is placed >= max emission timeMs — completedAtMs=100ms vs maxEmissionTimeMs=500ms (completion appears BEFORE emissions 2, 3, 4, 5)
  ```
- **Visual Impact in `MarbleDiagramComponent`**: In `marble-diagram.component.html:86-94`, `completedAtMs` is rendered as `<line [attr.x1]="timeToX(stream.completedAtMs)" ... />`. Because `timeToX(100)` is strictly less than `timeToX(200..500)`, the completion vertical tick is drawn directly over the first marble at t=100ms, while marbles 2, 3, 4, 5 continue to render to the right of the completion tick, violating the fundamental RxJS contract that streams cannot emit after termination.

---

### Observation 1.2: Visual Marble Collisions in `takeLast` Static Marbles
- **Source File**: `src/app/features/module3-operators/data/filtering.data.ts:212–215`:
  ```typescript
  initialMarbles: {
    inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 200, value: 1, displayLabel: '1' }, { id: '2', timeMs: 400, value: 2, displayLabel: '2' }, { id: '3', timeMs: 600, value: 3, displayLabel: '3' }], completedAtMs: 700 }],
    outputStream: { id: 'out', label: 'takeLast(2)', emissions: [{ id: 'o1', timeMs: 700, value: 2, displayLabel: '2' }, { id: 'o2', timeMs: 700, value: 3, displayLabel: '3' }], completedAtMs: 700 }
  },
  ```
- **Direct Empirical Failure**: Running `node tests/m3-challenger-semantic-audit.js`:
  ```
  [DEFECT] Zero emissions collide at identical timeMs in outputStream initialMarbles — Collisions detected: position at 700ms in filtering.data.ts
  ```
- **Visual Impact**: Emissions `o1` (value 2) and `o2` (value 3) both have `timeMs: 700`. In `MarbleDiagramComponent`, `timeToX(700)` computes the exact same `cx` coordinate for both SVG circles, completely hiding `o1` underneath `o2`. Additionally, `completedAtMs: 700` draws the completion tick directly down the center of both overlapping circles.

---

### Observation 1.3: Deprecation Visibility & Missing Callout Banners
- **Data Model Inspection**:
  - `src/app/core/models/index.ts:43–55` (`OperatorMetadata`) and `src/app/features/module3-operators/operator-catalog.models.ts:71–102` (`OperatorDefinition`) have no fields for `isDeprecated`, `deprecationNotice`, or `modernAlternative`.
- **Operator Data Inspection**:
  - The 7 deprecated operators are: `mapTo`, `pluck` (`transformation.data.ts`), `repeatWhen`, `retryWhen` (`utility.data.ts`), `multicast`, `publish`, `refCount` (`multicasting.data.ts`).
  - `multicasting.data.ts:330`: `refCount` description states:
    `"Piped onto a ConnectableObservable (from publish() or multicast()). Connects to source on the 1st subscriber, and automatically disconnects when subscriber count drops to zero."`
    It completely omits explicit deprecation notice (unlike `mapTo`, `pluck`, `repeatWhen`, `retryWhen`, `multicast`, `publish`).
- **Component UI Inspection**:
  - `src/app/shared/components/operator-card/operator-card.component.html`: Renders `name`, `category`, `difficulty`, `signature`, `useCases`, `pitfalls`, `relatedOperators`. Has zero markup or badges for deprecated status.
  - `src/app/features/module3-operators/operator-catalog.component.html:38–55`: The operator pill ribbon renders buttons without any indicator of whether an operator is deprecated.
  - The main container has no prominent banner or alert callout to warn developers against using deprecated APIs in new code.

---

## 2. Logic Chain

1. **Resolution of Marker Inversion**:
   - *From Observation 1.1*: Emissions from synchronous streams are assigned synthetic `timeMs = index * 100` (`100, 200, 300, 400, 500ms`) to prevent visual stacking on the SVG canvas.
   - *From Observation 1.1*: Termination (`complete` / `error`) occurs in < 1ms of real time.
   - *Deduction*: When calculating termination coordinates, the stream must inspect its own existing emissions. If `s.emissions.length > 0`, the termination coordinate must be at least `Math.max(...s.emissions.map(e => e.timeMs)) + 100`. If the stream was asynchronous and elapsed time exceeds `maxTime + 100`, elapsed time should take precedence.
   - *Formula*:
     ```typescript
     const maxTime = stream.emissions.length > 0 ? Math.max(...stream.emissions.map(e => e.timeMs)) : 0;
     const terminationTimeMs = Math.max(elapsed, maxTime + 100);
     ```
   - This formula must be applied uniformly to `recordInputComplete`, `recordInputError`, `recordOutputComplete`, and `recordOutputError`.

2. **Resolution of `takeLast` Coordinate Collision**:
   - *From Observation 1.2*: Input stream emits at 200, 400, 600ms and completes at 700ms.
   - *Deduction*: `takeLast(2)` waits for the source stream to complete before emitting its buffer. Therefore, the first buffered emission (`o1`, value 2) should occur at `700ms`. The second buffered emission (`o2`, value 3) should occur at `900ms` (200ms spacing). The stream completion tick should occur at `1100ms` (200ms spacing after the last emission).
   - This ensures all marbles and completion markers are cleanly separated, fully legible, and aligned with standard marble diagram conventions.

3. **Resolution of Deprecation Education**:
   - *From Observation 1.3*: Deprecated operators must clearly guide developers to modern RxJS 7+ alternatives per project requirement R3 / educational mandate.
   - *Deduction*: A three-tier deprecation UX must be implemented:
     1. **Ribbon Level**: A subtle `legacy` badge on pills in `OperatorCatalogComponent` to signal deprecation before clicking.
     2. **Catalog Page Level**: A prominent warning banner `<div class="deprecation-callout-banner" role="alert">` rendered directly above the tabbed playground whenever a deprecated operator is selected, displaying both the deprecation rationale and a highlighted `modernAlternative` code snippet.
     3. **Concept Card Level**: An amber `DEPRECATED` badge in the header of `app-operator-card` and a dedicated `<div class="card-deprecation-callout">` section inside the card body.

---

## 3. Caveats

1. **Read-Only Investigation**: As an explorer subagent, no application source files under `src/app/` were modified directly during this turn. All code blocks below are complete drop-in proposals ready for Worker M3.
2. **Reviewer 1 Finding 1 (63/65 Use Cases & Pitfalls)**: Missing `useCases` and `pitfalls` in the data files is assigned to `explorer_m3_fix_1`. This report specifically solves the Component UI, Timeline coordinates, and Deprecation presentation remediation.
3. **Audit Script Adjustment**: `tests/m3-challenger-semantic-audit.js` line 51 checks for `compSource.includes('Math.max(100, Date.now() - this.streamStartTime);')` which was written by the challenger to assert the presence of the bug. The worker must update the audit script assertions to verify `maxTime + 100` so that `node tests/m3-challenger-semantic-audit.js` exits 0.

---

## 4. Conclusion & Concrete Code Remediation Proposals

### Proposal 1: Fix Timeline Completion & Error Coordinates in `OperatorCatalogComponent`

**Target File**: `src/app/features/module3-operators/operator-catalog.component.ts`  
**Lines to Replace**: 482–494 and 518–526

#### Proposed Replacement Chunk:
```typescript
  private recordInputError(streamId: string): void {
    const elapsed = Math.max(0, Date.now() - this.streamStartTime);
    this.inputStreams.update(streams =>
      streams.map(s => {
        if (s.id !== streamId) return s;
        const maxTime = s.emissions.length > 0 ? Math.max(...s.emissions.map(e => e.timeMs)) : 0;
        const errorAtMs = Math.max(elapsed, maxTime + 100);
        return { ...s, errorAtMs };
      })
    );
  }

  private recordInputComplete(streamId: string): void {
    const elapsed = Math.max(0, Date.now() - this.streamStartTime);
    this.inputStreams.update(streams =>
      streams.map(s => {
        if (s.id !== streamId) return s;
        const maxTime = s.emissions.length > 0 ? Math.max(...s.emissions.map(e => e.timeMs)) : 0;
        const completedAtMs = Math.max(elapsed, maxTime + 100);
        return { ...s, completedAtMs };
      })
    );
  }

  private recordOutputError(): void {
    const elapsed = Math.max(0, Date.now() - this.streamStartTime);
    this.outputMarbleStream.update(out => {
      if (!out) return null;
      const maxTime = out.emissions.length > 0 ? Math.max(...out.emissions.map(e => e.timeMs)) : 0;
      const errorAtMs = Math.max(elapsed, maxTime + 100);
      return { ...out, errorAtMs };
    });
  }

  private recordOutputComplete(): void {
    const elapsed = Math.max(0, Date.now() - this.streamStartTime);
    this.outputMarbleStream.update(out => {
      if (!out) return null;
      const maxTime = out.emissions.length > 0 ? Math.max(...out.emissions.map(e => e.timeMs)) : 0;
      const completedAtMs = Math.max(elapsed, maxTime + 100);
      return { ...out, completedAtMs };
    });
  }
```

---

### Proposal 2: Fix `takeLast` Initial Marble Coordinates

**Target File**: `src/app/features/module3-operators/data/filtering.data.ts`  
**Line**: 214

#### Before:
```typescript
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 200, value: 1, displayLabel: '1' }, { id: '2', timeMs: 400, value: 2, displayLabel: '2' }, { id: '3', timeMs: 600, value: 3, displayLabel: '3' }], completedAtMs: 700 }],
      outputStream: { id: 'out', label: 'takeLast(2)', emissions: [{ id: 'o1', timeMs: 700, value: 2, displayLabel: '2' }, { id: 'o2', timeMs: 700, value: 3, displayLabel: '3' }], completedAtMs: 700 }
    },
```

#### After:
```typescript
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 200, value: 1, displayLabel: '1' }, { id: '2', timeMs: 400, value: 2, displayLabel: '2' }, { id: '3', timeMs: 600, value: 3, displayLabel: '3' }], completedAtMs: 700 }],
      outputStream: { id: 'out', label: 'takeLast(2)', emissions: [{ id: 'o1', timeMs: 700, value: 2, displayLabel: '2' }, { id: 'o2', timeMs: 900, value: 3, displayLabel: '3' }], completedAtMs: 1100 }
    },
```

---

### Proposal 3: Data Model & Deprecation Metadata Schema

#### 3A. Update `OperatorMetadata` (`src/app/core/models/index.ts:43–56`)
```typescript
export interface OperatorMetadata {
  name: string;
  category: OperatorCategory;
  signature: string;
  summary: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  useCases?: string[];
  pitfalls?: string[];
  marbleRules?: string[];
  relatedOperators?: string[];
  docUrl?: string;
  isDeprecated?: boolean;
  deprecationNotice?: string;
  modernAlternative?: string;
}
```

#### 3B. Update `OperatorDefinition` (`src/app/features/module3-operators/operator-catalog.models.ts:71–103`)
```typescript
export interface OperatorDefinition {
  id: string;
  name: string;
  category: OperatorCategoryId;
  categoryDisplayName?: string;
  signature: string;
  summary: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  metadata: OperatorMetadata;
  codeSnippet: string;
  codeExample: string;
  asciiMarble: AsciiMarble;
  marbleString?: string;
  defaultSourcePreset: SourceStreamPreset;
  defaultSource2Preset?: SourceStreamPreset;
  parameters: OperatorParamConfig[];
  interactiveConfig: InteractiveConfig;
  initialMarbles: {
    inputStreams: MarbleStream[];
    outputStream: MarbleStream;
  };
  comparison: ComparisonData;
  quiz: QuizQuestion[];
  hasNotifierTrigger?: boolean;
  notifierLabel?: string;
  useCases?: string[];
  pitfalls?: string[];
  relatedOperators?: string[];
  docUrl?: string;
  isDeprecated?: boolean;
  deprecationNotice?: string;
  modernAlternative?: string;
  pipelineFactory: (source$: Observable<any>, params: Record<string, any>, context: PipelineContext) => Observable<any>;
}
```

#### 3C. Populate Deprecation Data for All 7 Deprecated Operators

| Operator | Category | Target File | Deprecation Notice | Modern Alternative |
|---|---|---|---|---|
| `mapTo` | Transformation | `transformation.data.ts` | `mapTo is deprecated in RxJS 7 and scheduled for removal in RxJS 8. It provides minimal value over standard map and adds unnecessary bundle overhead.` | `map(() => value)` |
| `pluck` | Transformation | `transformation.data.ts` | `pluck is deprecated in RxJS 7 and scheduled for removal in RxJS 8. TypeScript cannot provide strict compile-time type safety for arbitrary string property paths.` | `map(x => x?.nestedProperty)` |
| `repeatWhen` | Utility | `utility.data.ts` | `repeatWhen is deprecated in RxJS 7. Managing the notification stream factory was overly complex and prone to subtle infinite resubscription loops.` | `repeat({ delay: (count) => timer(...) })` |
| `retryWhen` | Utility | `utility.data.ts` | `retryWhen is deprecated in RxJS 7. Handling the error stream factory was difficult to configure correctly and often led to silent unhandled errors.` | `retry({ delay: (error, retryCount) => timer(...) })` |
| `multicast` | Multicasting | `multicasting.data.ts` | `multicast is deprecated in RxJS 7 in favor of the connectable() factory and modern share() operator configuration.` | `connectable(source$, { connector: () => new Subject() }) or share()` |
| `publish` | Multicasting | `multicasting.data.ts` | `publish and its variants (publishBehavior, publishReplay, publishLast) are deprecated in RxJS 7 in favor of connectable().` | `connectable(source$) or share()` |
| `refCount` | Multicasting | `multicasting.data.ts` | `refCount is deprecated in RxJS 7 along with ConnectableObservable and publish(). Use share() or connectable() with resetOnRefCountZero.` | `share({ resetOnRefCountZero: true }) or connectable()` |

*Note for `refCount`*: Also update its `description` in `multicasting.data.ts:330` to append:  
`" Deprecated in RxJS 7 in favor of share() with reset configuration or connectable()."`

---

### Proposal 4: Visual Deprecation Callouts in `OperatorCardComponent`

#### 4A. Template Changes (`src/app/shared/components/operator-card/operator-card.component.html`)
At line 8 (inside `.name-category`):
```html
      @if (operator().isDeprecated) {
        <span class="badge badge-deprecated">DEPRECATED</span>
      }
```
And at line 32 (above `@if (!compact())`):
```html
  @if (operator().isDeprecated) {
    <div class="card-deprecation-callout" role="alert">
      <div class="dep-header">
        <span class="dep-icon">⚠️</span>
        <strong class="dep-title">Deprecated in RxJS 7+</strong>
      </div>
      <p class="dep-notice">{{ operator().deprecationNotice }}</p>
      @if (operator().modernAlternative) {
        <div class="dep-alternative">
          <span class="alt-label">Modern Replacement:</span>
          <code class="alt-code">{{ operator().modernAlternative }}</code>
        </div>
      }
    </div>
  }
```

#### 4B. Style Additions (`src/app/shared/components/operator-card/operator-card.component.scss`)
```scss
  .badge-deprecated {
    background-color: rgba(239, 68, 68, 0.18);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.35);
    font-weight: var(--font-weight-bold);
    letter-spacing: 0.04em;
    font-size: 10px;
    padding: 2px 7px;
    border-radius: var(--radius-full);
  }

  .card-deprecation-callout {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    background-color: rgba(245, 158, 11, 0.08);
    border: 1px solid rgba(245, 158, 11, 0.3);
    border-left: 4px solid #f59e0b;
    border-radius: var(--radius-md);

    .dep-header {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      color: #fbbf24;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      letter-spacing: 0.02em;

      .dep-icon {
        font-size: var(--font-size-sm);
      }
    }

    .dep-notice {
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
      line-height: var(--line-height-normal);
      margin: 0;
    }

    .dep-alternative {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--space-2);
      margin-top: 2px;
      font-size: var(--font-size-xs);

      .alt-label {
        color: var(--color-text-muted);
        font-weight: var(--font-weight-medium);
      }

      .alt-code {
        font-family: var(--font-mono);
        color: #38bdf8;
        background-color: var(--color-bg-code);
        padding: 2px 6px;
        border-radius: var(--radius-xs);
        border: 1px solid var(--color-border-subtle);
      }
    }
  }
```

---

### Proposal 5: Visual Deprecation Callouts in `OperatorCatalogComponent`

#### 5A. Template Changes (`src/app/features/module3-operators/operator-catalog.component.html`)
1. In the Operator Ribbon (line 42):
```html
      <button
        type="button"
        class="operator-pill"
        [class.active]="selectedOperatorId() === op.id"
        [class.deprecated]="op.isDeprecated || op.metadata.isDeprecated"
        (click)="selectOperator(op.id)"
        [title]="op.metadata.summary"
      >
        <span class="pill-name">{{ op.name }}</span>
        @if (op.isDeprecated || op.metadata.isDeprecated) {
          <span class="pill-deprecated-tag" title="Deprecated in RxJS 7+">legacy</span>
        }
        @if (isOperatorCompleted(op.id)) {
          <span class="pill-check">✓</span>
        }
      </button>
```

2. Directly Above `<app-playground-wrapper>` (line 57):
```html
  <!-- Top-Level Deprecation Alert Banner -->
  @if (currentOperator().isDeprecated || currentOperator().metadata.isDeprecated) {
    <div class="deprecation-callout-banner" role="alert">
      <div class="banner-badge">⚠️ DEPRECATED IN RxJS 7+</div>
      <div class="banner-body">
        <p class="banner-notice">
          {{ currentOperator().deprecationNotice || currentOperator().metadata.deprecationNotice }}
        </p>
        @if (currentOperator().modernAlternative || currentOperator().metadata.modernAlternative) {
          <div class="banner-modern">
            <span class="modern-label">Modern RxJS 7+ Replacement:</span>
            <code class="modern-code">{{ currentOperator().modernAlternative || currentOperator().metadata.modernAlternative }}</code>
          </div>
        }
      </div>
    </div>
  }
```

#### 5B. Style Additions (`src/app/features/module3-operators/operator-catalog.component.scss`)
```scss
  .operator-pill {
    &.deprecated {
      border-color: rgba(245, 158, 11, 0.35);
      
      .pill-deprecated-tag {
        font-size: 9px;
        text-transform: uppercase;
        padding: 1px 4px;
        border-radius: var(--radius-xs);
        background: rgba(245, 158, 11, 0.18);
        color: #fbbf24;
        font-weight: var(--font-weight-bold);
        letter-spacing: 0.04em;
      }
    }
  }

  .deprecation-callout-banner {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    background: linear-gradient(90deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.04) 100%);
    border: 1px solid rgba(245, 158, 11, 0.35);
    border-left: 5px solid #f59e0b;
    border-radius: var(--radius-lg);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

    .banner-badge {
      font-size: 11px;
      font-weight: var(--font-weight-bold);
      color: #fbbf24;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
    }

    .banner-body {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);

      .banner-notice {
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
        line-height: var(--line-height-normal);
        margin: 0;
      }

      .banner-modern {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--space-2);
        font-size: var(--font-size-xs);

        .modern-label {
          color: var(--color-text-muted);
          font-weight: var(--font-weight-medium);
        }

        .modern-code {
          font-family: var(--font-mono);
          font-size: var(--font-size-xs);
          color: #38bdf8;
          background-color: var(--color-bg-code);
          padding: 3px 8px;
          border-radius: var(--radius-xs);
          border: 1px solid rgba(56, 189, 248, 0.25);
        }
      }
    }
  }
```

---

### Proposal 6: Unit Test Additions

#### In `operator-catalog.component.spec.ts`:
Add under `describe('2. Catalog Data Schema & Completeness (65 Operators)')`:
```typescript
    it('should designate all 7 deprecated operators with deprecation notice and modern alternatives', () => {
      const deprecatedIds = ['mapTo', 'pluck', 'repeatWhen', 'retryWhen', 'multicast', 'publish', 'refCount'];
      for (const id of deprecatedIds) {
        const op = MODULE3_OPERATORS[id];
        expect(op).toBeDefined(`Operator ${id} missing`);
        expect(op.isDeprecated).toBeTrue(`Operator ${id} must have isDeprecated: true`);
        expect(op.metadata.isDeprecated).toBeTrue(`Operator ${id} metadata must have isDeprecated: true`);
        expect(op.deprecationNotice?.length).toBeGreaterThan(10, `Operator ${id} deprecationNotice missing`);
        expect(op.modernAlternative?.length).toBeGreaterThan(0, `Operator ${id} modernAlternative missing`);
      }
    });

    it('should dynamically space completion tick after synchronous emissions', () => {
      component.selectCategory('transformation');
      component.selectOperator('map');
      component.runOperatorStream();

      const outStream = component.outputMarbleStream();
      expect(outStream).not.toBeNull();
      expect(outStream!.completedAtMs).toBeDefined();

      const maxEmissionTime = Math.max(...outStream!.emissions.map(e => e.timeMs));
      expect(outStream!.completedAtMs!).toBeGreaterThanOrEqual(maxEmissionTime + 100);
    });
```

#### In `operator-card.component.spec.ts`:
```typescript
  it('should display deprecation banner and badge when operator is deprecated', () => {
    const deprecatedOp: OperatorMetadata = {
      ...mockOp,
      isDeprecated: true,
      deprecationNotice: 'Deprecated in RxJS 7 in favor of map(() => value)',
      modernAlternative: 'map(() => value)'
    };

    fixture.componentRef.setInput('operator', deprecatedOp);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.badge-deprecated')?.textContent).toContain('DEPRECATED');
    expect(el.querySelector('.card-deprecation-callout')?.textContent).toContain('Deprecated in RxJS 7');
    expect(el.querySelector('.alt-code')?.textContent).toContain('map(() => value)');
  });
```

---

## 5. Verification Method

Once Worker M3 implements the changes:

1. **Verify Semantic Audit Script**:
   ```powershell
   node tests/m3-challenger-semantic-audit.js
   ```
   *Expected*: Passes with `0 defects` and exit code 0.

2. **Verify Angular Unit Test Suite**:
   ```powershell
   npx ng test --watch=false --browsers=ChromeHeadless
   ```
   *Expected*: Passes with `154+ SUCCESS` and 0 failures.

3. **Verify Angular Development Compilation**:
   ```powershell
   npx ng build --configuration development
   ```
   *Expected*: Completes successfully with 0 compilation errors.

4. **Verify Milestone 3 E2E Tests**:
   ```powershell
   node tests/e2e/run-all-tests.js --milestone=M3
   ```
   *Expected*: `50 / 50 passed (100.0%)`, `0 failed`.

5. **Verify Full Platform E2E Suite**:
   ```powershell
   node tests/e2e/run-all-tests.js
   ```
   *Expected*: `543 / 543 passed (100.0%)`, `0 failed`, `0 regressions`.
