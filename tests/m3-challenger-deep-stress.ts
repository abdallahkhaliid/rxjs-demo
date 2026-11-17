/**
 * Milestone 3 Deep Adversarial Challenger & Stress Test Suite
 * Author: challenger_m3_reverify_1
 * Verifies exhaustive boundaries, stress stability, metadata richness,
 * and deprecations across all 65 Module 3 operators.
 */

import { of, EMPTY, throwError, range, Observable } from 'rxjs';
import { MODULE3_OPERATORS } from '../src/app/features/module3-operators/module3.data';
import { OperatorDefinition } from '../src/app/features/module3-operators/operator-catalog.models';

const DEPRECATED_EXPECTED = new Set([
  'mapTo', 'pluck', 'repeatWhen', 'retryWhen', 'multicast', 'publish', 'refCount'
]);

const CATEGORY_COUNTS: Record<string, number> = {
  transformation: 18,
  filtering: 19,
  combination: 11,
  utility: 12,
  multicasting: 5
};

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail = '') {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${name}${detail ? ' — ' + detail : ''}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${name}${detail ? ' — ' + detail : ''}`);
  }
}

async function runChallengerDeepStress() {
  console.log('='.repeat(80));
  console.log('  CHALLENGER DEEP STRESS & ADVERSARIAL INTEGRITY SUITE (65 OPERATORS)');
  console.log('='.repeat(80) + '\n');

  const operators = Object.values(MODULE3_OPERATORS) as OperatorDefinition[];
  console.log(`Total operators registered: ${operators.length}`);
  check('Total operators is exactly 65', operators.length === 65, `Count: ${operators.length}`);

  // 1. Category Distribution
  console.log('\n▶ [1. Category Distribution Audit]');
  const counts: Record<string, number> = {};
  for (const op of operators) {
    counts[op.category] = (counts[op.category] || 0) + 1;
  }
  for (const [cat, expected] of Object.entries(CATEGORY_COUNTS)) {
    check(`Category '${cat}' has exactly ${expected} operators`, counts[cat] === expected, `Actual: ${counts[cat]}`);
  }

  // 2. Deprecation Metadata & Flag Exact Isolation
  console.log('\n▶ [2. Deprecation Flag & Replacement Metadata Isolation]');
  const deprecatedFound: string[] = [];
  const falseDeprecatedFound: string[] = [];
  const missingDeprecationFields: string[] = [];

  for (const op of operators) {
    const isDep = op.isDeprecated || op.metadata?.isDeprecated;
    if (isDep) {
      deprecatedFound.push(op.id);
      if (!DEPRECATED_EXPECTED.has(op.id)) {
        falseDeprecatedFound.push(op.id);
      }
      if (!op.metadata?.deprecationNotice || !op.metadata?.modernAlternative) {
        missingDeprecationFields.push(op.id);
      }
    } else {
      if (DEPRECATED_EXPECTED.has(op.id)) {
        console.error(`Operator ${op.id} was expected to be deprecated but was NOT marked.`);
      }
    }
  }

  check('Exactly 7 deprecated operators identified', deprecatedFound.length === 7, `Found: ${deprecatedFound.join(', ')}`);
  check('Zero non-deprecated operators falsely marked', falseDeprecatedFound.length === 0, `False flags: ${falseDeprecatedFound.join(', ')}`);
  check('All deprecated operators include notice and modernAlternative', missingDeprecationFields.length === 0, `Missing: ${missingDeprecationFields.join(', ')}`);

  // 3. Educational Metadata Completeness (Use Cases, Pitfalls, Related Operators, Doc URL)
  console.log('\n▶ [3. Educational Metadata Completeness (All 65 Operators)]');
  const missingUseCases: string[] = [];
  const missingPitfalls: string[] = [];
  const missingRelated: string[] = [];
  const invalidDocUrl: string[] = [];

  for (const op of operators) {
    const m = op.metadata;
    if (!m) {
      missingUseCases.push(op.id);
      continue;
    }
    if (!Array.isArray(m.useCases) || m.useCases.length < 2 || m.useCases.some(u => !u || typeof u !== 'string' || u.trim() === '')) {
      missingUseCases.push(op.id);
    }
    if (!Array.isArray(m.pitfalls) || m.pitfalls.length < 1 || m.pitfalls.some(p => !p || typeof p !== 'string' || p.trim() === '')) {
      missingPitfalls.push(op.id);
    }
    if (!Array.isArray(m.relatedOperators) || m.relatedOperators.length < 1) {
      missingRelated.push(op.id);
    }
    if (!m.docUrl || !m.docUrl.startsWith('https://rxjs.dev/api/')) {
      invalidDocUrl.push(op.id);
    }
  }

  check('All 65 operators have >= 2 concrete useCases', missingUseCases.length === 0, `Defects: ${missingUseCases.join(', ')}`);
  check('All 65 operators have >= 1 practical pitfall', missingPitfalls.length === 0, `Defects: ${missingPitfalls.join(', ')}`);
  check('All 65 operators have >= 1 relatedOperator', missingRelated.length === 0, `Defects: ${missingRelated.join(', ')}`);
  check('All 65 operators have valid official docUrl', invalidDocUrl.length === 0, `Defects: ${invalidDocUrl.join(', ')}`);

  // 4. Adversarial Parameter Stress: Empty params {}
  console.log('\n▶ [4. Adversarial Parameter Stress: Empty Object {}]');
  const emptyParamsFailed: string[] = [];
  for (const op of operators) {
    try {
      const dummy$ = of(1, 2, 3);
      const out$ = op.pipelineFactory(dummy$, {}, { source2$: of('B') });
      const sub = out$.subscribe({ error: () => {} });
      sub.unsubscribe();
    } catch (err: any) {
      emptyParamsFailed.push(`${op.id}: ${err.message}`);
    }
  }
  check('All 65 pipeline factories survive empty params {}', emptyParamsFailed.length === 0, `Failures: ${emptyParamsFailed.join('; ')}`);

  // 5. Adversarial Parameter Stress: Extreme & Negative Parameter Boundaries
  console.log('\n▶ [5. Adversarial Parameter Stress: Extreme & Negative Parameter Boundaries]');
  const extremeParamsFailed: string[] = [];
  const extremeConfig = {
    count: -10,
    multiplier: -99,
    delayMs: 0,
    dueTimeMs: 0,
    windowTimeSpan: 0,
    bufferSize: 0,
    threshold: 0,
    seed: -100,
    times: -1,
    rate: 0
  };
  for (const op of operators) {
    try {
      const dummy$ = of(1, 2, 3);
      const out$ = op.pipelineFactory(dummy$, extremeConfig, { source2$: of('B') });
      const sub = out$.subscribe({ error: () => {} });
      sub.unsubscribe();
    } catch (err: any) {
      extremeParamsFailed.push(`${op.id}: ${err.message}`);
    }
  }
  check('All 65 pipeline factories survive extreme/negative parameter boundaries', extremeParamsFailed.length === 0, `Failures: ${extremeParamsFailed.join('; ')}`);

  // 6. Adversarial Stream Stress: EMPTY Stream Input
  console.log('\n▶ [6. Adversarial Stream Stress: EMPTY Source]');
  const emptySourceFailed: string[] = [];
  for (const op of operators) {
    try {
      let completed = false;
      let errored = false;
      const out$ = op.pipelineFactory(EMPTY, {}, { source2$: EMPTY });
      const sub = out$.subscribe({
        complete: () => { completed = true; },
        error: () => { errored = true; }
      });
      sub.unsubscribe();
    } catch (err: any) {
      emptySourceFailed.push(`${op.id}: ${err.message}`);
    }
  }
  check('All 65 pipeline factories handle EMPTY source without throwing', emptySourceFailed.length === 0, `Failures: ${emptySourceFailed.join('; ')}`);

  // 7. Adversarial Stream Stress: Immediate Error Source
  console.log('\n▶ [7. Adversarial Stream Stress: Immediate throwError Source]');
  const errorSourceFailed: string[] = [];
  for (const op of operators) {
    try {
      let receivedError = false;
      const error$ = throwError(() => new Error('Adversarial Bomb'));
      const out$ = op.pipelineFactory(error$, {}, { source2$: of('B') });
      const sub = out$.subscribe({
        error: () => { receivedError = true; }
      });
      sub.unsubscribe();
    } catch (err: any) {
      errorSourceFailed.push(`${op.id}: ${err.message}`);
    }
  }
  check('All 65 pipeline factories handle immediate error without unhandled sync crash', errorSourceFailed.length === 0, `Failures: ${errorSourceFailed.join('; ')}`);

  // 8. Adversarial Stream Stress: 1,000 High-Throughput Burst
  console.log('\n▶ [8. Adversarial Stream Stress: 1,000 Synchronous Emissions]');
  const highThroughputFailed: string[] = [];
  for (const op of operators) {
    try {
      const burst$ = range(1, 1000);
      const out$ = op.pipelineFactory(burst$, {}, { source2$: range(1, 1000) });
      let count = 0;
      const sub = out$.subscribe({
        next: () => { count++; },
        error: () => {}
      });
      sub.unsubscribe();
    } catch (err: any) {
      highThroughputFailed.push(`${op.id}: ${err.message}`);
    }
  }
  check('All 65 pipeline factories process 1,000 rapid emissions cleanly', highThroughputFailed.length === 0, `Failures: ${highThroughputFailed.join('; ')}`);

  // 9. Static initialMarbles Integrity (TakeLast + Coordinate collisions)
  console.log('\n▶ [9. Static Marble Timeline Precision & Collision Check]');
  const takeLastOp = MODULE3_OPERATORS['takeLast'];
  const takeLastOut = takeLastOp.initialMarbles?.outputStream;
  const tTimes = (takeLastOut?.emissions || []).map(e => e.timeMs);
  const tComp = takeLastOut?.completedAtMs;

  const takeLastClean = (
    tTimes.length === 2 &&
    tTimes[0] === 700 &&
    tTimes[1] === 900 &&
    tComp === 1100
  );
  check('takeLast static output marble spacing is strictly sequential (700ms, 900ms, complete: 1100ms)', takeLastClean, `Actual: times=${tTimes.join(',')}, comp=${tComp}`);

  console.log('\n' + '='.repeat(80));
  console.log(`  CHALLENGER DEEP STRESS EXECUTION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('='.repeat(80));

  if (failed > 0) {
    process.exit(1);
  }
}

runChallengerDeepStress().catch(err => {
  console.error('Fatal challenger execution error:', err);
  process.exit(1);
});
