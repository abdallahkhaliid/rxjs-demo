/**
 * Comprehensive Test Harness and Runner Core for RxJS E2E Test Suite.
 */

const { expect, AssertionError } = require('./assert');

const registry = {
  tests: [],
  currentSuite: '',
  beforeEachHooks: [],
  afterEachHooks: []
};

function describe(suiteName, fn) {
  const previousSuite = registry.currentSuite;
  registry.currentSuite = previousSuite ? `${previousSuite} > ${suiteName}` : suiteName;
  try {
    fn();
  } finally {
    registry.currentSuite = previousSuite;
  }
}

function it(name, fn, meta = {}) {
  const fullName = registry.currentSuite ? `${registry.currentSuite} > ${name}` : name;
  const featureIdNum = typeof meta.featureId === 'string'
    ? parseInt(meta.featureId.replace(/\D/g, ''), 10)
    : meta.featureId;

  registry.tests.push({
    fullName,
    name,
    fn,
    tier: meta.tier ?? 1,
    featureId: featureIdNum,
    featureTag: meta.featureId != null ? (typeof meta.featureId === 'number' ? `F${String(meta.featureId).padStart(2, '0')}` : meta.featureId) : undefined,
    featureName: meta.featureName ?? '',
    milestone: meta.milestone ?? 'M1',
    category: meta.category ?? 'general',
    suite: registry.currentSuite
  });
}

const test = it;

function beforeEach(fn) {
  registry.beforeEachHooks.push(fn);
}

function afterEach(fn) {
  registry.afterEachHooks.push(fn);
}

function parseCliArgs(args = process.argv.slice(2)) {
  const options = {
    tier: null,
    milestone: null,
    featureId: null,
    filter: null,
    bail: false,
    verbose: false,
    json: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--bail' || arg === '-b') {
      options.bail = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg.startsWith('--tier=')) {
      const val = arg.split('=')[1];
      options.tier = val.split(',').map(v => parseInt(v.trim(), 10)).filter(n => !isNaN(n));
    } else if (arg === '--tier' && i + 1 < args.length) {
      options.tier = args[++i].split(',').map(v => parseInt(v.trim(), 10)).filter(n => !isNaN(n));
    } else if (arg.startsWith('--milestone=')) {
      const val = arg.split('=')[1];
      options.milestone = val.split(',').map(v => v.trim().toUpperCase());
    } else if (arg === '--milestone' && i + 1 < args.length) {
      options.milestone = args[++i].split(',').map(v => v.trim().toUpperCase());
    } else if (arg.startsWith('--feature=')) {
      const val = arg.split('=')[1];
      options.featureId = val.split(',').map(v => {
        const clean = v.trim();
        const num = parseInt(clean.replace(/\D/g, ''), 10);
        return isNaN(num) ? clean : num;
      });
    } else if (arg === '--feature' && i + 1 < args.length) {
      options.featureId = args[++i].split(',').map(v => {
        const clean = v.trim();
        const num = parseInt(clean.replace(/\D/g, ''), 10);
        return isNaN(num) ? clean : num;
      });
    } else if (arg.startsWith('--filter=')) {
      options.filter = arg.split('=')[1];
    } else if (arg === '--filter' && i + 1 < args.length) {
      options.filter = args[++i];
    }
  }

  return options;
}

function matchesFilter(testItem, options) {
  if (options.tier && options.tier.length > 0) {
    if (!options.tier.includes(testItem.tier)) return false;
  }
  if (options.milestone && options.milestone.length > 0) {
    if (!options.milestone.includes(testItem.milestone)) return false;
  }
  if (options.featureId && options.featureId.length > 0) {
    const match = options.featureId.some(id => {
      if (typeof id === 'number') return testItem.featureId === id;
      return testItem.featureTag === id || String(testItem.featureId) === id;
    });
    if (!match) return false;
  }
  if (options.filter) {
    const regex = new RegExp(options.filter, 'i');
    if (!regex.test(testItem.fullName) && !regex.test(testItem.category) && !regex.test(testItem.featureName)) {
      return false;
    }
  }
  return true;
}

async function runAll(options = {}) {
  const opts = { ...parseCliArgs(), ...options };

  if (opts.help) {
    console.log(`
RxJS Learning Platform E2E Test Runner
======================================
Usage:
  node tests/e2e/run-all-tests.js [options]
  npx ts-node -P tests/tsconfig.e2e.json tests/e2e/runner.ts [options]

Options:
  --tier=1,2,3,4        Execute specific tier(s) (1=Features, 2=Boundaries, 3=Combinations, 4=Scenarios)
  --milestone=M1,M2...  Execute tests for specific milestone(s) (M1 through M6)
  --feature=1,2,F12...  Execute tests for specific feature IDs
  --filter=<pattern>    Filter tests by name, suite, or category
  --bail, -b            Halt execution immediately on first test failure
  --verbose, -v         Display detailed execution log for every single test
  --json                Emit complete machine-readable JSON results
  --help, -h            Show this help dialog
    `);
    process.exit(0);
  }

  const startTime = Date.now();
  const selectedTests = registry.tests.filter(t => matchesFilter(t, opts));

  const results = {
    total: selectedTests.length,
    registered: registry.tests.length,
    passed: 0,
    failed: 0,
    skipped: registry.tests.length - selectedTests.length,
    failures: [],
    byTier: {
      tier1: { total: 0, passed: 0, failed: 0 },
      tier2: { total: 0, passed: 0, failed: 0 },
      tier3: { total: 0, passed: 0, failed: 0 },
      tier4: { total: 0, passed: 0, failed: 0 }
    },
    byMilestone: {
      M1: { total: 0, passed: 0, failed: 0 },
      M2: { total: 0, passed: 0, failed: 0 },
      M3: { total: 0, passed: 0, failed: 0 },
      M4: { total: 0, passed: 0, failed: 0 },
      M5: { total: 0, passed: 0, failed: 0 },
      M6: { total: 0, passed: 0, failed: 0 }
    },
    byFeature: {},
    durationMs: 0
  };

  if (!opts.json) {
    console.log('='.repeat(78));
    console.log('  RxJS Learning Platform — Opaque-Box E2E Acceptance Test Suite');
    console.log('='.repeat(78));
    console.log(`Running ${selectedTests.length} tests (out of ${registry.tests.length} registered)...`);
    if (opts.tier) console.log(`Filter: Tier(s) = [${opts.tier.join(', ')}]`);
    if (opts.milestone) console.log(`Filter: Milestone(s) = [${opts.milestone.join(', ')}]`);
    if (opts.featureId) console.log(`Filter: Feature(s) = [${opts.featureId.join(', ')}]`);
    if (opts.filter) console.log(`Filter: Query = "${opts.filter}"`);
    console.log('-'.repeat(78));
  }

  let activeTier = null;

  for (let i = 0; i < selectedTests.length; i++) {
    const testItem = selectedTests[i];
    const tierKey = `tier${testItem.tier}`;

    // Initialize stats
    if (results.byTier[tierKey]) results.byTier[tierKey].total++;
    if (results.byMilestone[testItem.milestone]) results.byMilestone[testItem.milestone].total++;
    if (testItem.featureId != null) {
      if (!results.byFeature[testItem.featureId]) {
        results.byFeature[testItem.featureId] = {
          tag: testItem.featureTag,
          name: testItem.featureName,
          milestone: testItem.milestone,
          tier1: 0,
          tier2: 0,
          tier3: 0,
          tier4: 0,
          total: 0,
          passed: 0,
          failed: 0
        };
      }
      results.byFeature[testItem.featureId].total++;
      results.byFeature[testItem.featureId][`tier${testItem.tier}`]++;
    }

    if (!opts.json && !opts.verbose && testItem.tier !== activeTier) {
      activeTier = testItem.tier;
      const tierLabels = {
        1: 'Tier 1 — Feature Coverage (Core Requirements)',
        2: 'Tier 2 — Boundary, Corner Cases & Stress Integrity',
        3: 'Tier 3 — Cross-Feature & Cross-Module Interactions',
        4: 'Tier 4 — Real-World Application Scenarios'
      };
      console.log(`\n▶ [${tierLabels[activeTier] || `Tier ${activeTier}`}]`);
    }

    const testStart = Date.now();
    let passed = false;
    let error = null;

    try {
      for (const hook of registry.beforeEachHooks) {
        await hook();
      }

      await testItem.fn({ expect });
      passed = true;
      results.passed++;
      if (results.byTier[tierKey]) results.byTier[tierKey].passed++;
      if (results.byMilestone[testItem.milestone]) results.byMilestone[testItem.milestone].passed++;
      if (testItem.featureId != null) results.byFeature[testItem.featureId].passed++;

      if (opts.verbose) {
        console.log(`  ✓ [T${testItem.tier}|${testItem.featureTag || 'GEN'}|${testItem.milestone}] ${testItem.fullName} (${Date.now() - testStart}ms)`);
      } else if (!opts.json) {
        process.stdout.write('.');
      }
    } catch (err) {
      error = err;
      results.failed++;
      if (results.byTier[tierKey]) results.byTier[tierKey].failed++;
      if (results.byMilestone[testItem.milestone]) results.byMilestone[testItem.milestone].failed++;
      if (testItem.featureId != null) results.byFeature[testItem.featureId].failed++;

      const failureRecord = {
        name: testItem.fullName,
        tier: testItem.tier,
        featureId: testItem.featureId,
        featureTag: testItem.featureTag,
        milestone: testItem.milestone,
        error: err.message,
        stack: err.stack
      };
      results.failures.push(failureRecord);

      if (opts.verbose) {
        console.log(`  ✗ [T${testItem.tier}|${testItem.featureTag || 'GEN'}|${testItem.milestone}] ${testItem.fullName} FAILED!`);
        console.log(`    Error: ${err.message}`);
      } else if (!opts.json) {
        process.stdout.write('F');
      }

      if (opts.bail) {
        if (!opts.json) console.log('\n[BAIL] Halting execution due to test failure.');
        break;
      }
    } finally {
      for (const hook of registry.afterEachHooks) {
        try {
          await hook();
        } catch (cleanupErr) {
          console.error('Error in afterEach hook:', cleanupErr);
        }
      }
    }
  }

  results.durationMs = Date.now() - startTime;

  if (opts.json) {
    console.log(JSON.stringify(results, null, 2));
    return results;
  }

  console.log('\n');
  console.log('='.repeat(78));
  console.log('  E2E Test Execution Summary');
  console.log('='.repeat(78));

  console.log(`Total Executed : ${results.total} / ${registry.tests.length}`);
  console.log(`Passed         : \x1b[32m${results.passed}\x1b[0m`);
  console.log(`Failed         : ${results.failed > 0 ? `\x1b[31m${results.failed}\x1b[0m` : '0'}`);
  console.log(`Skipped        : ${results.skipped}`);
  console.log(`Total Duration : ${(results.durationMs / 1000).toFixed(2)}s\n`);

  console.log('Breakdown by Tier:');
  console.log('-'.repeat(78));
  const tLabels = {
    tier1: 'Tier 1 (Feature Coverage)        ',
    tier2: 'Tier 2 (Boundaries & Corners)    ',
    tier3: 'Tier 3 (Cross-Feature Pairwise)  ',
    tier4: 'Tier 4 (Real-World Scenarios)    '
  };
  for (const [tKey, stats] of Object.entries(results.byTier)) {
    const rate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : '100.0';
    const statusCol = stats.failed === 0 ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
    console.log(`  ${tLabels[tKey]} : ${String(stats.passed).padStart(3)} / ${String(stats.total).padStart(3)} passed (${rate.padStart(5)}%) [${statusCol}]`);
  }

  console.log('\nBreakdown by Milestone:');
  console.log('-'.repeat(78));
  for (const [mKey, stats] of Object.entries(results.byMilestone)) {
    const rate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : '100.0';
    const statusCol = stats.failed === 0 ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
    console.log(`  Milestone ${mKey} : ${String(stats.passed).padStart(3)} / ${String(stats.total).padStart(3)} passed (${rate.padStart(5)}%) [${statusCol}]`);
  }

  if (results.failures.length > 0) {
    console.log('\n' + '='.repeat(78));
    console.log('  Failures Detail:');
    console.log('='.repeat(78));
    results.failures.forEach((f, idx) => {
      console.log(`\n[${idx + 1}] [${f.featureTag || 'GEN'}] ${f.name}`);
      console.log(`    Milestone: ${f.milestone} | Tier: ${f.tier}`);
      console.log(`    Message  : ${f.error}`);
      if (f.stack) {
        console.log(`    Stack    :\n${f.stack.split('\n').slice(0, 5).map(l => '      ' + l).join('\n')}`);
      }
    });
  }

  console.log('='.repeat(78));
  return results;
}

module.exports = {
  describe,
  it,
  test,
  beforeEach,
  afterEach,
  expect,
  runAll,
  parseCliArgs,
  registry
};
