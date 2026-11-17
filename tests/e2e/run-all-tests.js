#!/usr/bin/env node
/**
 * Master Test Runner Entry Point for RxJS Learning Platform E2E Test Suite.
 * Executes all tests across Tiers 1 through 4.
 */

const { runAll } = require('./harness/runner-core');

// 1. Tier 1: Feature Coverage (Features 1 through 52)
require('./tier1-features/t1-shell-design-api');
require('./tier1-features/t1-fundamentals');
require('./tier1-features/t1-creation-operators');
require('./tier1-features/t1-category-operators');
require('./tier1-features/t1-hoo-subjects-schedulers');
require('./tier1-features/t1-angular-mini-projects');
require('./tier1-features/t1-polish-navigation-acceptance');

// 2. Tier 2: Boundary, Corner Cases & Stress Integrity
require('./tier2-boundaries/t2-shell-design-api-boundaries');
require('./tier2-boundaries/t2-fundamentals-boundaries');
require('./tier2-boundaries/t2-creation-operators-boundaries');
require('./tier2-boundaries/t2-category-operators-boundaries');
require('./tier2-boundaries/t2-hoo-subjects-schedulers-boundaries');
require('./tier2-boundaries/t2-angular-mini-projects-boundaries');
require('./tier2-boundaries/t2-polish-navigation-acceptance-boundaries');

// 3. Tier 3: Cross-Feature Combinations & Pairwise Module Interactions
require('./tier3-combinations/t3-cross-feature-interactions');

// 4. Tier 4: Real-World Application Scenarios
require('./tier4-scenarios/t4-real-world-scenarios');

// Execute test suite
runAll().then(results => {
  if (results.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}).catch(err => {
  console.error('Fatal Test Runner Execution Error:', err);
  process.exit(1);
});
