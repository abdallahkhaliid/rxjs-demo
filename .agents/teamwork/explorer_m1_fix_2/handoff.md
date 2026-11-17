# HANDOFF REPORT — Explorer M1 Fix 2 (MarbleDiagram SVG Geometry Specialist)

**Role**: MarbleDiagram SVG Geometry Specialist Explorer  
**Working Directory**: `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\explorer_m1_fix_2\`  
**Target Component**: `src/app/shared/components/marble-diagram/marble-diagram.component.ts`  
**Date**: 2026-11-06T00:16:00Z  

---

## 1. Observation

### 1.1 Verbatim Empirical Failure
The adversarial test suite in `src/app/shared/components/adversarial-stress.spec.ts` was executed against ChromeHeadless via:
```powershell
npx ng test --watch=false --browsers=ChromeHeadless --include="**/adversarial-stress.spec.ts"
```
The test failed on test case `C3.5`:
```
WARN: 'EMPIRICAL BUG CONFIRMED: durationMs=0 results in NaN SVG coordinates', Object{scrubberX: NaN, emissionX: NaN}
Chrome Headless 156.0.0.0 (Windows 10) Milestone 1 Adversarial & Stress Suite MarbleDiagramComponent Adversarial Tests C3.5: [CHALLENGE] behavior when durationMs = 0 (divide by zero check) FAILED
	Expected true to be false.
	    at <Jasmine>
	    at UserContext.<anonymous> (src/app/shared/components/adversarial-stress.spec.ts:353:36)
	    at <Jasmine>
	Expected true to be false.
	    at <Jasmine>
	    at UserContext.<anonymous> (src/app/shared/components/adversarial-stress.spec.ts:354:39)
	    at <Jasmine>
```

### 1.2 Vulnerable Code Inspection
In `src/app/shared/components/marble-diagram/marble-diagram.component.ts`:

- **Lines 59–62 (`scrubberX` computed signal)**:
  ```typescript
  readonly scrubberX = computed(() => {
    const progress = this.currentTimeMs() / this.durationMs();
    return this.PADDING_LEFT + Math.min(Math.max(progress, 0), 1) * this.TIMELINE_WIDTH;
  });
  ```
- **Lines 140–143 (`timeToX` coordinate mapper)**:
  ```typescript
  timeToX(timeMs: number): number {
    const ratio = Math.min(Math.max(timeMs / this.durationMs(), 0), 1);
    return this.PADDING_LEFT + ratio * this.TIMELINE_WIDTH;
  }
  ```
- **Lines 145–148 (`xToTime` inverse mapper)**:
  ```typescript
  xToTime(x: number): number {
    const relX = Math.min(Math.max(x - this.PADDING_LEFT, 0), this.TIMELINE_WIDTH);
    return Math.round((relX / this.TIMELINE_WIDTH) * this.durationMs());
  }
  ```

### 1.3 SVG DOM Template Impact
In `src/app/shared/components/marble-diagram/marble-diagram.component.html`:
- Scrubber playhead (lines 246–258):
  ```html
  <line [attr.x1]="scrubberX()" y1="10" [attr.x2]="scrubberX()" [attr.y2]="viewBoxHeight() - 10" class="scrubber-line" />
  <circle [attr.cx]="scrubberX()" cy="10" r="4" class="scrubber-handle" />
  ```
- Marble circles & labels (lines 121–135 and 224–238):
  ```html
  <circle [attr.cx]="timeToX(emission.timeMs)" [attr.cy]="getStreamY(sIdx)" r="13" [attr.fill]="getMarbleColor(mIdx, emission)" class="marble-circle" />
  <text [attr.x]="timeToX(emission.timeMs)" [attr.y]="getStreamY(sIdx) + 1" ... class="marble-text">{{ emission.displayLabel }}</text>
  ```
- Completion tick (lines 87–93 and 189–195):
  ```html
  <line [attr.x1]="timeToX(stream.completedAtMs)" ... [attr.x2]="timeToX(stream.completedAtMs)" ... class="marker-completion" />
  ```
When `scrubberX()` or `timeToX()` returns `NaN`, the template renders `<line x1="NaN" x2="NaN">`, `<circle cx="NaN">`, and `<text x="NaN">`. According to the W3C SVG specification, `NaN` is an invalid coordinate value, causing rendering drops, SVG parsing warnings, and broken client hit-testing.

### 1.4 JavaScript IEEE-754 Nuance
A direct evaluation of `Math.max(this.durationMs(), 1)` was tested:
```javascript
Math.max(NaN, 1);       // Evaluates to NaN!
Math.max(undefined, 1); // Evaluates to NaN!
Math.max(0, 1);         // Evaluates to 1
Math.max(NaN || 0, 1);  // Evaluates to 1
```
If `this.durationMs()` evaluates to `NaN` or `undefined` at runtime (e.g., untyped template expressions or dynamic binding delays), `Math.max(this.durationMs(), 1)` fails to eliminate `NaN`. Guarding with `Math.max(this.durationMs() || 0, 1)` guarantees a finite positive number `>= 1`.

---

## 2. Logic Chain

1. **Premise 1 (Division by Zero Trigger)**:
   In `MarbleDiagramComponent`, `durationMs` has a default of `5000` (`durationMs = input<number>(5000);`). However, when callers bind `[durationMs]="0"` (such as synchronous emissions, instantaneous completion, or zero-delay streams), `this.currentTimeMs() / this.durationMs()` evaluates to `0 / 0 = NaN`.
2. **Premise 2 (NaN Propagation in Math Functions)**:
   Under IEEE-754 arithmetic in JavaScript, `Math.max(NaN, 0)` evaluates to `NaN`, and `Math.min(NaN, 1)` evaluates to `NaN`. Therefore, any arithmetic operation `PADDING_LEFT + NaN * TIMELINE_WIDTH` results in `NaN`.
3. **Premise 3 (SVG Coordinate Failure)**:
   SVG user agents (e.g. Chrome/Blink) reject `NaN` coordinates on `<line x1, x2>`, `<circle cx>`, and `<text x>`. In the Karma headless environment, this caused test `C3.5` to fail on both assertions (`expect(Number.isNaN(scrubX)).toBeFalse()` and `expect(Number.isNaN(emissionX)).toBeFalse()`).
4. **Premise 4 (Defensive Guard Formulation)**:
   By substituting `this.durationMs()` with a sanitized `duration = Math.max(this.durationMs() || 0, 1)`:
   - When `durationMs` is `0`, `duration` becomes `1`.
   - `0 / 1` evaluates to `0`.
   - `ratio` evaluates to `0`.
   - `scrubberX` evaluates to `PADDING_LEFT` (`110`), a valid coordinate.
   - For an emission at `t = 0`, `timeToX(0)` evaluates to `PADDING_LEFT` (`110`), a valid coordinate.
   - For any emission at `t > 0` with `durationMs = 0`, `t / 1 >= 1` clamps cleanly to `1`, mapping to `PADDING_LEFT + TIMELINE_WIDTH` (`800`), the end of the timeline axis.
   - When `durationMs` is negative (e.g. `-100`), `duration` is clamped to `1`, preventing inverted or negative timeline coordinates.
   - When `durationMs` is `NaN` or `undefined`, `NaN || 0` produces `0`, clamping safely to `1`.
5. **Premise 5 (Timestamp Defense in `timeToX` and `xToTime`)**:
   Adding `Number.isFinite(timeMs) ? timeMs : 0` guarantees that even if an emission or marker has an invalid or missing timestamp, `timeToX` gracefully renders at `PADDING_LEFT` (`110`) rather than corrupting the SVG canvas.

---

## 3. Caveats

1. **Read-Only Investigation Role**:
   Per the Teamwork rules, this explorer has NOT applied edits to `src/app/shared/components/marble-diagram/marble-diagram.component.ts`. The patch must be applied by Worker M1.
2. **Semantic Representation of 0ms Duration**:
   Clamping duration to `1ms` visually places `t = 0` at the very start of the timeline axis (X = 110) and any positive time (e.g. `t >= 1ms`) at the end of the timeline axis (X = 800). For an instant observable (e.g. `of(1, 2, 3)`), all synchronous emissions at `t = 0` align at `x = 110`, accurately representing simultaneous occurrence.
3. **Timeline Geometry Constants**:
   The component constants `PADDING_LEFT = 110`, `PADDING_RIGHT = 40`, `SVG_WIDTH = 840`, and `TIMELINE_WIDTH = 690` remain unchanged. All clamped outputs strictly stay within the visible range `[110, 800]`.

---

## 4. Conclusion

### Recommended Fix Strategy
Apply the following localized edits in `src/app/shared/components/marble-diagram/marble-diagram.component.ts`:

#### Change 1: `scrubberX` computed signal (lines 59–62)
```typescript
<<<< BEFORE
  readonly scrubberX = computed(() => {
    const progress = this.currentTimeMs() / this.durationMs();
    return this.PADDING_LEFT + Math.min(Math.max(progress, 0), 1) * this.TIMELINE_WIDTH;
  });
====
  readonly scrubberX = computed(() => {
    const duration = Math.max(this.durationMs() || 0, 1);
    const progress = this.currentTimeMs() / duration;
    return this.PADDING_LEFT + Math.min(Math.max(progress, 0), 1) * this.TIMELINE_WIDTH;
  });
>>>> AFTER
```

#### Change 2: `timeToX` method (lines 140–143)
```typescript
<<<< BEFORE
  timeToX(timeMs: number): number {
    const ratio = Math.min(Math.max(timeMs / this.durationMs(), 0), 1);
    return this.PADDING_LEFT + ratio * this.TIMELINE_WIDTH;
  }
====
  timeToX(timeMs: number): number {
    const duration = Math.max(this.durationMs() || 0, 1);
    const safeTime = Number.isFinite(timeMs) ? timeMs : 0;
    const ratio = Math.min(Math.max(safeTime / duration, 0), 1);
    return this.PADDING_LEFT + ratio * this.TIMELINE_WIDTH;
  }
>>>> AFTER
```

#### Change 3: `xToTime` method (lines 145–148)
```typescript
<<<< BEFORE
  xToTime(x: number): number {
    const relX = Math.min(Math.max(x - this.PADDING_LEFT, 0), this.TIMELINE_WIDTH);
    return Math.round((relX / this.TIMELINE_WIDTH) * this.durationMs());
  }
====
  xToTime(x: number): number {
    const duration = Math.max(this.durationMs() || 0, 0);
    const safeX = Number.isFinite(x) ? x : this.PADDING_LEFT;
    const relX = Math.min(Math.max(safeX - this.PADDING_LEFT, 0), this.TIMELINE_WIDTH);
    return Math.round((relX / this.TIMELINE_WIDTH) * duration);
  }
>>>> AFTER
```

A patch file has also been generated for direct application:  
`c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\explorer_m1_fix_2\marble-diagram.patch`

---

## 5. Verification Method

To independently verify the fix:

1. **Verify Current Failure**:
   Execute:
   ```powershell
   npx ng test --watch=false --browsers=ChromeHeadless --include="**/adversarial-stress.spec.ts"
   ```
   Confirm failure on `MarbleDiagramComponent Adversarial Tests C3.5: [CHALLENGE] behavior when durationMs = 0 (divide by zero check) FAILED`.

2. **Apply Proposed Fix**:
   Worker M1 applies the changes to `src/app/shared/components/marble-diagram/marble-diagram.component.ts`.

3. **Re-run Test Suite**:
   Execute:
   ```powershell
   npx ng test --watch=false --browsers=ChromeHeadless --include="**/adversarial-stress.spec.ts"
   ```
   Confirm that `C3.5` passes and no `EMPIRICAL BUG CONFIRMED: durationMs=0 results in NaN SVG coordinates` warning is logged.

4. **Verify Existing Component Unit Tests**:
   Execute:
   ```powershell
   npx ng test --watch=false --browsers=ChromeHeadless --include="**/marble-diagram.component.spec.ts"
   ```
   Confirm all existing tests pass (`timeToX(0) === 110`, `timeToX(5000) === 800`, `xToTime(110) === 0`, `xToTime(800) === 5000`).

5. **Verify Build**:
   Execute:
   ```powershell
   npx ng build --configuration development
   ```
   Confirm compilation succeeds with exit code `0`.
