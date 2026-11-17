/**
 * Milestone 5 Empirical & Adversarial Challenger Suite
 * Author: challenger_m5_2 (Empirical Challenger: Critic & Specialist)
 *
 * Verifies:
 * 1. Shopping Cart Reducer Precision (1,000 randomized action sequences, zero NaN, float precision to 2 decimals, qty >= 1)
 * 2. State Store Immutability & Selectors (deep slice selector safety 5 levels deep, mutation isolation, 0 selector re-emissions on identical updates)
 * 3. Form Wizard Step Boundaries (step jump blocking, role change reset, exhaustMap rapid double-click single emission)
 */

import { CartService, cartReducer, computeCartSummary } from '../src/app/features/module8-mini-projects/services/cart.service';
import { CourseStateStoreService } from '../src/app/features/module7-angular/course-state-store.service';
import { FormWizardService, validateStep1, validateStep2, validateStep3 } from '../src/app/features/module8-mini-projects/services/form-wizard.service';
import { CatalogProduct, CartItem, UserRole } from '../src/app/features/module8-mini-projects/module8.models';
import { CATALOG_PRODUCTS, VALID_COUPONS } from '../src/app/features/module8-mini-projects/module8.data';

interface TestRecord {
  name: string;
  passed: boolean;
  details: string;
}

const records: TestRecord[] = [];
let passedCount = 0;
let failedCount = 0;

function assertCheck(name: string, condition: boolean, details = '') {
  if (condition) {
    passedCount++;
    console.log(`  [PASS] ${name}${details ? ' — ' + details : ''}`);
  } else {
    failedCount++;
    console.error(`  [FAIL] ${name}${details ? ' — ' + details : ''}`);
  }
  records.push({ name, passed: Boolean(condition), details });
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// CHALLENGE 1: Shopping Cart Reducer Precision & 1,000 Randomized Action Sequences
// ============================================================================
async function runChallenge1_ShoppingCart() {
  console.log('\n' + '='.repeat(80));
  console.log('CHALLENGE 1: Shopping Cart Reducer Precision & 1,000 Action Sequences');
  console.log('='.repeat(80));

  // Catalog products including floating point test products
  const testCatalog: CatalogProduct[] = [
    ...CATALOG_PRODUCTS,
    { id: 101, name: 'Float Item 0.10', category: 'Test', price: 0.10, rating: 5, icon: '🧪', description: 'Float test 0.1' },
    { id: 102, name: 'Float Item 0.20', category: 'Test', price: 0.20, rating: 5, icon: '🧪', description: 'Float test 0.2' },
    { id: 103, name: 'Float Item 0.05', category: 'Test', price: 0.05, rating: 5, icon: '🧪', description: 'Float test 0.05' },
    { id: 104, name: 'High Precision Item', category: 'Test', price: 19.99, rating: 5, icon: '🧪', description: 'Float test 19.99' },
    { id: 105, name: 'Cent Item', category: 'Test', price: 0.01, rating: 5, icon: '🧪', description: 'Float test 0.01' }
  ];

  // Specific Float Precision Check (0.1 + 0.2 problem)
  console.log('\n▶ Subtest 1.1: Exact Float Drift Verification (0.1 + 0.2)');
  const floatItems: CartItem[] = [
    { ...testCatalog.find(p => p.id === 101)!, qty: 1 },
    { ...testCatalog.find(p => p.id === 102)!, qty: 1 }
  ];
  const floatSummary = computeCartSummary(floatItems, '');
  assertCheck(
    'Float drift test: 0.1 + 0.2 yields exactly 0.3 without 0.30000000000000004 drift',
    floatSummary.subtotal === 0.3 && floatSummary.total === 0.32,
    `subtotal=${floatSummary.subtotal}, total=${floatSummary.total}`
  );

  // 1,000 Randomized Actions Stress Test
  console.log('\n▶ Subtest 1.2: 1,000 Randomized Action Sequences on CartService');
  const cart = new CartService();
  const couponsToTest = ['RXJS20', 'DEV50', 'REACTIVE10', 'INVALID_COUPON', '  rxjs20  ', '', 'XYZ_123', 'dev50'];

  let nanDetected = 0;
  let floatDriftDetected = 0;
  let subOneQtyDetected = 0;
  let actionCount = 0;
  const targetActions = 1000;

  for (let i = 0; i < targetActions; i++) {
    actionCount++;
    const roll = Math.random();

    if (roll < 0.35) {
      // ADD Action (random product, random qty including negative and 0)
      const product = testCatalog[Math.floor(Math.random() * testCatalog.length)];
      const randomQty = Math.floor(Math.random() * 8) - 2; // -2 to 5
      cart.addItem(product, randomQty);
    } else if (roll < 0.55) {
      // UPDATE_QTY Action (existing or random non-existent ID, qty including negative numbers)
      const currentItems = cart.getItems();
      const targetId = currentItems.length > 0 && Math.random() < 0.8
        ? currentItems[Math.floor(Math.random() * currentItems.length)].id
        : Math.floor(Math.random() * 10000) + 5000; // non-existent ID
      const randomQty = Math.floor(Math.random() * 20) - 10; // -10 to 9
      cart.updateQuantity(targetId, randomQty);
    } else if (roll < 0.70) {
      // REMOVE Action (existing or non-existent ID)
      const currentItems = cart.getItems();
      const targetId = currentItems.length > 0 && Math.random() < 0.7
        ? currentItems[Math.floor(Math.random() * currentItems.length)].id
        : -9999; // non-existent negative ID
      cart.removeItem(targetId);
    } else if (roll < 0.90) {
      // APPLY_COUPON Action
      const coupon = couponsToTest[Math.floor(Math.random() * couponsToTest.length)];
      cart.applyCoupon(coupon);
    } else {
      // CLEAR Action
      cart.clearCart();
    }

    // Inspect summary and items after every single action
    const summary = cart.getSummary();
    const items = cart.getItems();

    // 1. Check for NaN in all numeric summary fields
    if (
      isNaN(summary.subtotal) ||
      isNaN(summary.discount) ||
      isNaN(summary.tax) ||
      isNaN(summary.total) ||
      isNaN(summary.itemCount)
    ) {
      nanDetected++;
    }

    // 2. Check for float precision: exactly rounded to 2 decimals
    const isRoundedTo2Decimals = (n: number) => Math.round(n * 100) / 100 === n;
    if (
      !isRoundedTo2Decimals(summary.subtotal) ||
      !isRoundedTo2Decimals(summary.discount) ||
      !isRoundedTo2Decimals(summary.tax) ||
      !isRoundedTo2Decimals(summary.total)
    ) {
      floatDriftDetected++;
    }

    // 3. Check that item quantity never drops below 1
    for (const item of items) {
      if (item.qty < 1 || isNaN(item.qty)) {
        subOneQtyDetected++;
      }
    }
  }

  assertCheck(
    'Zero NaN values detected across 1,000 randomized actions',
    nanDetected === 0,
    `NaN occurrences: ${nanDetected}`
  );

  assertCheck(
    'Float precision rounded to 2 decimals without drift across all 1,000 states',
    floatDriftDetected === 0,
    `Float drift occurrences: ${floatDriftDetected}`
  );

  assertCheck(
    'Item quantity NEVER drops below 1 in cart state across all 1,000 states',
    subOneQtyDetected === 0,
    `Sub-1 quantity occurrences: ${subOneQtyDetected}`
  );

  assertCheck(
    'Final summary formula is mathematically sound: total === round(subtotal - discount + tax)',
    cart.getSummary().total === Math.round((cart.getSummary().subtotal - cart.getSummary().discount + cart.getSummary().tax) * 100) / 100,
    `Summary: ${JSON.stringify(cart.getSummary())}`
  );
}

// ============================================================================
// CHALLENGE 2: State Store Immutability & Selectors
// ============================================================================
async function runChallenge2_StateStore() {
  console.log('\n' + '='.repeat(80));
  console.log('CHALLENGE 2: State Store Immutability & Selectors (CourseStateStoreService)');
  console.log('='.repeat(80));

  const store = new CourseStateStoreService();
  store.resetStore();

  // 2.1 Deep Slice Selector Safety (5 levels deep)
  console.log('\n▶ Subtest 2.1: Deep Slice Selector Safety (5 levels deep)');
  let deepNonExistentResult: any = 'NOT_SET';
  let deepErrorThrown = false;

  try {
    store.select((s: any) => s.deepLevel1.deepLevel2.deepLevel3.deepLevel4.deepLevel5).subscribe({
      next: val => { deepNonExistentResult = val; },
      error: () => { deepErrorThrown = true; }
    });
  } catch {
    deepErrorThrown = true;
  }

  assertCheck(
    '5-level deep non-existent slice selector does NOT throw uncaught error',
    !deepErrorThrown,
    `Thrown: ${deepErrorThrown}`
  );
  assertCheck(
    '5-level deep non-existent slice selector safely returns undefined',
    deepNonExistentResult === undefined,
    `Result: ${deepNonExistentResult}`
  );

  // 2.2 Identical Updates Trigger 0 Selector Re-Emissions
  console.log('\n▶ Subtest 2.2: Identical Updates Trigger 0 Selector Re-Emissions');
  let filterCategoryEmissions = 0;
  let coursesEmissions = 0;
  let enrolledCountEmissions = 0;

  store.filterCategory$.subscribe(() => filterCategoryEmissions++);
  store.courses$.subscribe(() => coursesEmissions++);
  store.enrolledCount$.subscribe(() => enrolledCountEmissions++);

  assertCheck('Initial selector emissions are exactly 1', filterCategoryEmissions === 1 && coursesEmissions === 1 && enrolledCountEmissions === 1);

  // Dispatch identical category filter ('all' -> 'all') 5 times
  for (let i = 0; i < 5; i++) {
    store.setCategoryFilter('all');
  }
  assertCheck(
    'Identical SET_CATEGORY_FILTER("all") triggers 0 selector re-emissions',
    filterCategoryEmissions === 1,
    `Emissions after 5 identical updates: ${filterCategoryEmissions} (expected 1)`
  );

  // Dispatch unrelated action: SET_SEARCH_TERM
  store.setSearchTerm('Angular');
  assertCheck(
    'Unrelated action SET_SEARCH_TERM triggers 0 re-emissions on filterCategory$ & enrolledCount$',
    filterCategoryEmissions === 1 && enrolledCountEmissions === 1,
    `filterCategory emissions: ${filterCategoryEmissions}, enrolledCount emissions: ${enrolledCountEmissions}`
  );

  // 2.3 State Store Immutability & Mutation Isolation
  console.log('\n▶ Subtest 2.3: State Store Immutability & Mutation Isolation');
  const snapshotBefore = store.getState();
  store.setCategoryFilter('RxJS');
  const snapshotAfter = store.getState();

  assertCheck(
    'Store state reference updates immutably on action dispatch (snapshotBefore !== snapshotAfter)',
    snapshotBefore !== snapshotAfter,
    `Before ref !== After ref: ${snapshotBefore !== snapshotAfter}`
  );
  assertCheck(
    'Historical snapshotBefore is not mutated by subsequent action',
    snapshotBefore.filterCategory === 'all' && snapshotAfter.filterCategory === 'RxJS',
    `Before: ${snapshotBefore.filterCategory}, After: ${snapshotAfter.filterCategory}`
  );

  // Adversarial challenge: what happens if a rogue subscriber attempts to mutate the emitted state?
  let emittedStateRef: any;
  store.state$.subscribe(s => { emittedStateRef = s; });

  const originalCategory = store.getState().filterCategory;
  // Attempt mutating the emitted state reference:
  emittedStateRef.filterCategory = 'MUTATED_ADVERSARIAL';
  const internalCategoryAfterMutation = store.getState().filterCategory;

  // Check if internal BehaviorSubject state was contaminated by external mutation:
  const isBehaviorSubjectContaminated = internalCategoryAfterMutation === 'MUTATED_ADVERSARIAL';
  console.log(`  [EMPIRICAL OBSERVATION] Mutating emitted state object directly:`);
  console.log(`    - Internal BehaviorSubject holds reference: ${isBehaviorSubjectContaminated ? 'VULNERABLE (mutated directly)' : 'PROTECTED (isolated)'}`);

  // Re-establish clean state
  store.resetStore();
}

// ============================================================================
// CHALLENGE 3: Form Wizard Step Boundaries & exhaustMap Double-Click
// ============================================================================
async function runChallenge3_FormWizard() {
  console.log('\n' + '='.repeat(80));
  console.log('CHALLENGE 3: Form Wizard Step Boundaries & exhaustMap Double-Click');
  console.log('='.repeat(80));

  const wizard = new FormWizardService();
  wizard.reset();

  // 3.1 Step Jumping Blocked
  console.log('\n▶ Subtest 3.1: Step Jumping Blocked Without Valid Prior Steps');
  assertCheck('Initial step is step 1', wizard.currentState.currentStep === 1);

  const jumpTo3Blocked = wizard.setStep(3);
  assertCheck(
    'Attempting to jump to step 3 without valid step 1 & 2 returns false and is BLOCKED',
    jumpTo3Blocked === false && wizard.currentState.currentStep === 1,
    `setStep(3) returned: ${jumpTo3Blocked}, currentStep: ${wizard.currentState.currentStep}`
  );

  const jumpTo2Blocked = wizard.setStep(2);
  assertCheck(
    'Attempting to jump to step 2 without valid step 1 returns false and is BLOCKED',
    jumpTo2Blocked === false && wizard.currentState.currentStep === 1,
    `setStep(2) returned: ${jumpTo2Blocked}, currentStep: ${wizard.currentState.currentStep}`
  );

  // Complete step 1 with valid data
  wizard.updateStep1({ username: 'challenger_dev', email: 'challenger@test.com', fullName: 'Challenger' });
  assertCheck('Step 1 validation passes with valid username & email', wizard.currentState.completedSteps[1] === true);

  // Still cannot jump to step 3 because step 2 is not completed
  const jumpTo3StillBlocked = wizard.setStep(3);
  assertCheck(
    'Attempting to jump to step 3 with step 1 valid but step 2 incomplete is BLOCKED',
    jumpTo3StillBlocked === false && wizard.currentState.currentStep === 1,
    `setStep(3) returned: ${jumpTo3StillBlocked}, currentStep: ${wizard.currentState.currentStep}`
  );

  // Advance to step 2
  const advanceTo2 = wizard.nextStep();
  assertCheck('Advancing to step 2 succeeds after step 1 is valid', advanceTo2 === true && wizard.currentState.currentStep === 2);

  // 3.2 Role Changes Reset Step 2 Selections
  console.log('\n▶ Subtest 3.2: Role Changes Reset Step 2 Selections');
  wizard.updateStep2({ role: 'beginner', topics: ['fundamentals', 'creation'] });
  assertCheck('Topics populated for beginner role', wizard.currentState.step2.topics.length === 2);

  // Change role to 'advanced'
  wizard.setRole('advanced');
  assertCheck(
    'Role change from "beginner" to "advanced" resets topics array to []',
    wizard.currentState.step2.role === 'advanced' && wizard.currentState.step2.topics.length === 0,
    `role: ${wizard.currentState.step2.role}, topics: [${wizard.currentState.step2.topics.join(', ')}]`
  );
  assertCheck(
    'Step 2 validation becomes false after role change resets topics',
    wizard.currentState.completedSteps[2] === false,
    `completedSteps[2]: ${wizard.currentState.completedSteps[2]}`
  );

  // Setting the same role again does not needlessly overwrite
  wizard.updateStep2({ topics: ['schedulers'] });
  wizard.setRole('advanced');
  assertCheck(
    'Setting identical role "advanced" preserves existing selected topics',
    wizard.currentState.step2.topics.length === 1 && wizard.currentState.step2.topics[0] === 'schedulers'
  );

  // Complete step 2 and step 3
  wizard.setStep(3); // Now step 1 & 2 are valid, so jump to 3 should succeed!
  assertCheck('Advancing to step 3 succeeds once step 1 & 2 are completed', wizard.currentState.currentStep === 3);
  wizard.updateStep3({ agreedToTerms: true, notes: 'Empirical challenge submission' });
  assertCheck('Step 3 validated with agreedToTerms: true', wizard.currentState.completedSteps[3] === true);

  // 3.3 Rapid Double-Click on Submit Produces Exactly 1 Emission via exhaustMap
  console.log('\n▶ Subtest 3.3: Rapid Double-Click Submit with exhaustMap');
  let submissionEmissions = 0;
  let receivedData: any = null;

  const sub = wizard.submissionResult$.subscribe(res => {
    submissionEmissions++;
    receivedData = res;
  });

  // Rapidly fire submit 5 times within 10ms (simulating aggressive multi-click / double-click)
  wizard.submit();
  wizard.submit();
  wizard.submit();
  wizard.submit();
  wizard.submit();

  // Wait 60ms for the 30ms simulated delay in exhaustMap to finish
  await sleep(60);

  assertCheck(
    'Rapid 5x submit burst produces EXACTLY 1 emission via exhaustMap',
    submissionEmissions === 1,
    `Actual emissions: ${submissionEmissions}`
  );
  assertCheck(
    'Submission completed with success: true and valid payload',
    receivedData !== null && receivedData.success === true && receivedData.data.step1.username === 'challenger_dev'
  );

  sub.unsubscribe();
}

// ============================================================================
// MAIN RUNNER
// ============================================================================
async function main() {
  console.log('='.repeat(80));
  console.log('  MILESTONE 5 ADVERSARIAL CHALLENGER EMPIRICAL SUITE');
  console.log('='.repeat(80));

  await runChallenge1_ShoppingCart();
  await runChallenge2_StateStore();
  await runChallenge3_FormWizard();

  console.log('\n' + '='.repeat(80));
  console.log(`SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED out of ${records.length} CHECKS`);
  console.log('='.repeat(80) + '\n');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal error during empirical suite execution:', err);
  process.exit(1);
});
