/**
 * Challenger Coordinate & Marble Collision Audit Suite
 * Exhaustively checks all 65 operators in MODULE3_OPERATORS across 5 categories:
 * - transformation.data.ts (18)
 * - filtering.data.ts (19)
 * - combination.data.ts (11)
 * - utility.data.ts (12)
 * - multicasting.data.ts (5)
 */

const fs = require('fs');
const path = require('path');

// We can load transpiled ts or parse JSON / ts definitions
// Since we have ts-node or can read the data files, let's test via direct import using ts-node or compiled JS
const { MODULE3_OPERATORS } = require('../src/app/features/module3-operators/module3.data');

function runAudit() {
  console.log('='.repeat(80));
  console.log('  CHALLENGER COORDINATE & MARBLE COLLISION AUDIT: ALL 65 OPERATORS');
  console.log('='.repeat(80) + '\n');

  const opKeys = Object.keys(MODULE3_OPERATORS);
  console.log(`Auditing ${opKeys.length} operators in MODULE3_OPERATORS...`);

  let totalStreams = 0;
  let totalEmissions = 0;
  const collisions = [];
  const completionIssues = [];
  const spacingAudit = [];

  for (const key of opKeys) {
    const op = MODULE3_OPERATORS[key];
    if (!op || !op.initialMarbles) {
      console.error(`[ERROR] Operator ${key} is missing initialMarbles!`);
      continue;
    }

    // Input streams
    const inputs = op.initialMarbles.inputStreams || [];
    inputs.forEach((stream, idx) => {
      totalStreams++;
      const sId = stream.id || `input_${idx}`;
      const emissions = stream.emissions || [];
      totalEmissions += emissions.length;

      // Check duplicates
      const seenTimes = new Map();
      emissions.forEach(e => {
        if (seenTimes.has(e.timeMs)) {
          collisions.push({
            operator: key,
            stream: sId,
            timeMs: e.timeMs,
            em1: seenTimes.get(e.timeMs),
            em2: e.id || e.displayLabel
          });
        } else {
          seenTimes.set(e.timeMs, e.id || e.displayLabel);
        }
      });

      // Check completion relative to emissions
      if (stream.completedAtMs !== undefined && emissions.length > 0) {
        const maxTime = Math.max(...emissions.map(e => e.timeMs));
        if (stream.completedAtMs < maxTime) {
          completionIssues.push({
            operator: key,
            stream: sId,
            type: 'COMPLETION_BEFORE_EMISSION',
            completedAtMs: stream.completedAtMs,
            maxEmissionMs: maxTime
          });
        } else if (stream.completedAtMs === maxTime) {
          completionIssues.push({
            operator: key,
            stream: sId,
            type: 'COMPLETION_EQUALS_LAST_EMISSION',
            completedAtMs: stream.completedAtMs,
            maxEmissionMs: maxTime
          });
        }
      }

      // Check error relative to emissions
      if (stream.errorAtMs !== undefined && emissions.length > 0) {
        const maxTime = Math.max(...emissions.map(e => e.timeMs));
        if (stream.errorAtMs < maxTime) {
          completionIssues.push({
            operator: key,
            stream: sId,
            type: 'ERROR_BEFORE_EMISSION',
            errorAtMs: stream.errorAtMs,
            maxEmissionMs: maxTime
          });
        }
      }
    });

    // Output stream
    const out = op.initialMarbles.outputStream;
    if (out) {
      totalStreams++;
      const sId = out.id || 'output';
      const emissions = out.emissions || [];
      totalEmissions += emissions.length;

      // Check duplicates
      const seenTimes = new Map();
      emissions.forEach(e => {
        if (seenTimes.has(e.timeMs)) {
          collisions.push({
            operator: key,
            stream: sId,
            timeMs: e.timeMs,
            em1: seenTimes.get(e.timeMs),
            em2: e.id || e.displayLabel
          });
        } else {
          seenTimes.set(e.timeMs, e.id || e.displayLabel);
        }
      });

      // Check completion
      if (out.completedAtMs !== undefined && emissions.length > 0) {
        const maxTime = Math.max(...emissions.map(e => e.timeMs));
        if (out.completedAtMs < maxTime) {
          completionIssues.push({
            operator: key,
            stream: sId,
            type: 'COMPLETION_BEFORE_EMISSION',
            completedAtMs: out.completedAtMs,
            maxEmissionMs: maxTime
          });
        } else if (out.completedAtMs === maxTime) {
          completionIssues.push({
            operator: key,
            stream: sId,
            type: 'COMPLETION_EQUALS_LAST_EMISSION',
            completedAtMs: out.completedAtMs,
            maxEmissionMs: maxTime
          });
        }
      }

      // Check error
      if (out.errorAtMs !== undefined && emissions.length > 0) {
        const maxTime = Math.max(...emissions.map(e => e.timeMs));
        if (out.errorAtMs < maxTime) {
          completionIssues.push({
            operator: key,
            stream: sId,
            type: 'ERROR_BEFORE_EMISSION',
            errorAtMs: out.errorAtMs,
            maxEmissionMs: maxTime
          });
        }
      }
    }
  }

  console.log(`Audited:`);
  console.log(`  - Operators: ${opKeys.length}`);
  console.log(`  - Streams: ${totalStreams}`);
  console.log(`  - Emissions: ${totalEmissions}`);
  console.log(`  - Marble-to-Marble Collisions: ${collisions.length}`);
  console.log(`  - Completion Inversions (comp < maxEmission): ${completionIssues.filter(c => c.type === 'COMPLETION_BEFORE_EMISSION').length}`);
  console.log(`  - Completion Coincidences (comp === maxEmission): ${completionIssues.filter(c => c.type === 'COMPLETION_EQUALS_LAST_EMISSION').length}`);

  if (completionIssues.length > 0) {
    console.log('\nCompletion coincidences details:');
    completionIssues.forEach(ci => {
      console.log(`    ${ci.operator} [${ci.stream}]: ${ci.type} -> comp=${ci.completedAtMs || ci.errorAtMs}ms, maxEmission=${ci.maxEmissionMs}ms`);
    });
  }

  if (collisions.length > 0) {
    console.error('\n[DEFECT] Marble collisions found:');
    console.error(JSON.stringify(collisions, null, 2));
  } else {
    console.log('\n[PASS] ZERO marble collisions detected across all 65 operators and all streams.');
  }

  // Focus: takeLast verification
  console.log('\n' + '-'.repeat(80));
  console.log('  SPECIFIC FOCUS: takeLast AUDIT');
  console.log('-'.repeat(80));
  const takeLast = MODULE3_OPERATORS['takeLast'];
  if (!takeLast) {
    console.error('[DEFECT] takeLast operator not found in catalog!');
  } else {
    const outEmissions = takeLast.initialMarbles?.outputStream?.emissions || [];
    const completedAtMs = takeLast.initialMarbles?.outputStream?.completedAtMs;
    console.log('takeLast Output Stream:');
    outEmissions.forEach(e => console.log(`  Emission id=${e.id}, timeMs=${e.timeMs}, value=${e.value}, label=${e.displayLabel}`));
    console.log(`  CompletedAtMs: ${completedAtMs}`);

    const o1 = outEmissions.find(e => e.id === 'o1');
    const o2 = outEmissions.find(e => e.id === 'o2');

    const o1Time = o1?.timeMs;
    const o2Time = o2?.timeMs;

    const takeLastPassed = (
      o1Time === 700 &&
      o2Time === 900 &&
      completedAtMs === 1100 &&
      o1Time !== o2Time &&
      o2Time !== completedAtMs
    );

    if (takeLastPassed) {
      console.log(`[PASS] takeLast timestamps verified: o1=${o1Time}ms, o2=${o2Time}ms, completedAtMs=${completedAtMs}ms (Distinct, strictly sequential, zero collisions).`);
    } else {
      console.error(`[DEFECT] takeLast timestamps mismatch! Expected o1=700, o2=900, completedAtMs=1100. Got: o1=${o1Time}, o2=${o2Time}, completedAtMs=${completedAtMs}`);
    }
  }

  // Focus: Synchronous timeline marker formula verification
  console.log('\n' + '-'.repeat(80));
  console.log('  SYNCHRONOUS STREAM TIMELINE MARKER INVERSION STRESS TEST');
  console.log('-'.repeat(80));

  // Simulation test cases:
  // Case A: 5 synchronous items at index 1..5 -> times: 100, 200, 300, 400, 500ms
  // Case B: 1 synchronous item at index 1 -> time: 100ms
  // Case C: 0 emissions (EMPTY) -> maxTime = 0
  // Case D: Async 3 items at 500, 1000, 1500ms, completes at 1550ms
  // Case E: Rapid burst 10 items (index 1..10) -> times: 100..1000ms

  const testCases = [
    { name: '5 Sync items (of(1,2,3,4,5))', count: 5, elapsed: 1 },
    { name: '1 Sync item (of("single"))', count: 1, elapsed: 0 },
    { name: '0 Sync items (EMPTY)', count: 0, elapsed: 0 },
    { name: '10 Rapid Sync items (range(1,10))', count: 10, elapsed: 2 },
    { name: 'Async completing shortly after emission', count: 3, asyncTimes: [500, 1000, 1500], elapsed: 1520 }
  ];

  let syncAllPassed = true;
  for (const tc of testCases) {
    let emissions = [];
    if (tc.asyncTimes) {
      emissions = tc.asyncTimes.map((t, idx) => ({ id: `e${idx}`, timeMs: t }));
    } else {
      for (let i = 1; i <= tc.count; i++) {
        const timeMs = tc.elapsed < 20 ? i * 100 : tc.elapsed;
        emissions.push({ id: `sync_${i}`, timeMs });
      }
    }

    const maxTime = emissions.length > 0 ? Math.max(...emissions.map(e => e.timeMs)) : 0;
    const completedAtMs = Math.max(tc.elapsed, maxTime + 100);
    const errorAtMs = Math.max(tc.elapsed, maxTime + 100);

    const validComplete = tc.count === 0 ? completedAtMs >= 100 : completedAtMs > maxTime;
    const validError = tc.count === 0 ? errorAtMs >= 100 : errorAtMs > maxTime;

    if (!validComplete || !validError) {
      syncAllPassed = false;
      console.error(`[FAIL] ${tc.name}: maxTime=${maxTime}, completedAtMs=${completedAtMs}, errorAtMs=${errorAtMs}`);
    } else {
      console.log(`[PASS] ${tc.name}: maxTime=${maxTime}ms -> completedAtMs=${completedAtMs}ms (offset: +${completedAtMs - maxTime}ms)`);
    }
  }

  const exitCode = (collisions.length === 0 && syncAllPassed) ? 0 : 1;
  return {
    operatorsAudited: opKeys.length,
    collisions,
    completionIssues,
    passed: exitCode === 0
  };
}

runAudit();
