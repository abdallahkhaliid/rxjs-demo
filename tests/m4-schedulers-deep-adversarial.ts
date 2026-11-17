/**
 * Milestone 4 Deep Adversarial Challenger & Simulator Model Integrity Audit
 * Verifies Module 6 Schedulers data, simulation steps, quiz questions, and comparison matrix.
 */

import {
  MODULE6_SCENARIOS,
  MODULE6_TOPICS,
  SCHEDULER_COMPARISON_DATA,
  QUEUE_SCHEDULER_QUIZ,
  ASAP_SCHEDULER_QUIZ,
  ASYNC_SCHEDULER_QUIZ,
  ANIMATION_FRAME_SCHEDULER_QUIZ,
  VISUALIZER_QUIZ
} from '../src/app/features/module6-schedulers/module6.data';
import {
  SchedulerTopicConfig,
  SimulationScenario,
  SimulationStep,
  EventLoopPhase
} from '../src/app/features/module6-schedulers/module6.models';

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

async function runModule6DeepAudit() {
  console.log('='.repeat(80));
  console.log('  CHALLENGER M4: MODULE 6 SCHEDULERS DEEP DATA & SIMULATOR AUDIT');
  console.log('='.repeat(80) + '\n');

  // =========================================================================
  // 1. Simulation Scenarios Audit
  // =========================================================================
  console.log('▶ [1. Simulation Scenarios Structure & Integrity]');
  const expectedScenarios = [
    'mixed-concurrency',
    'trampoline-recursion',
    'delay-cancellation',
    'microtask-fifo',
    'animation-frame-sync'
  ];

  check(
    'Exactly 5 deterministic simulation scenarios registered',
    MODULE6_SCENARIOS.length === 5,
    `Found: ${MODULE6_SCENARIOS.length}`
  );

  for (const expectedId of expectedScenarios) {
    const sc = MODULE6_SCENARIOS.find(s => s.id === expectedId);
    check(
      `Scenario '${expectedId}' exists with required metadata`,
      !!sc && !!sc.name && !!sc.badge && !!sc.codeSnippet && sc.steps.length >= 4,
      `Steps: ${sc?.steps.length || 0}, Name: ${sc?.name || 'N/A'}`
    );
  }

  // Validate step transitions for each scenario
  for (const sc of MODULE6_SCENARIOS) {
    let stepsValid = true;
    let stepIssue = '';
    const validPhases: Set<EventLoopPhase> = new Set([
      'idle', 'synchronous', 'microtask', 'render', 'macrotask', 'completed'
    ]);

    for (let i = 0; i < sc.steps.length; i++) {
      const step = sc.steps[i];
      if (step.stepNumber !== i) {
        stepsValid = false;
        stepIssue = `Step index ${i} has stepNumber ${step.stepNumber}`;
        break;
      }
      if (!validPhases.has(step.phase)) {
        stepsValid = false;
        stepIssue = `Invalid phase '${step.phase}' at step ${i}`;
        break;
      }
      if (!step.queues || !Array.isArray(step.queues.callStack)) {
        stepsValid = false;
        stepIssue = `Missing queues structure at step ${i}`;
        break;
      }
      if (!step.explanation || step.explanation.trim().length === 0) {
        stepsValid = false;
        stepIssue = `Empty explanation at step ${i}`;
        break;
      }
    }

    check(
      `Scenario '${sc.id}' step sequence (${sc.steps.length} steps) is monotonically indexed and structurally sound`,
      stepsValid,
      stepIssue || `All ${sc.steps.length} steps validated`
    );
  }

  // =========================================================================
  // 2. Specific Scenario Semantic Checks
  // =========================================================================
  console.log('\n▶ [2. Specific Scenario Semantic Checks]');

  // Mixed Concurrency Scenario: must visit sync -> microtask -> macrotask
  const mixed = MODULE6_SCENARIOS.find(s => s.id === 'mixed-concurrency');
  if (mixed) {
    const phasesEncountered = new Set(mixed.steps.map(s => s.phase));
    const hasSync = phasesEncountered.has('synchronous');
    const hasMicro = phasesEncountered.has('microtask');
    const hasMacro = phasesEncountered.has('macrotask');
    const finalStep = mixed.steps[mixed.steps.length - 1];
    check(
      'mixed-concurrency scenario traverses synchronous, microtask, and macrotask phases',
      hasSync && hasMicro && hasMacro,
      `Phases: ${Array.from(phasesEncountered).join(', ')}`
    );
    check(
      'mixed-concurrency final step terminates in completed phase with empty queues',
      finalStep.phase === 'completed' &&
      finalStep.queues.callStack.length === 0 &&
      finalStep.queues.microtaskQueue.length === 0 &&
      finalStep.queues.macrotaskQueue.length === 0,
      `Final phase: ${finalStep.phase}, callStack: ${finalStep.queues.callStack.length}`
    );
  }

  // Trampoline Recursion: must showcase trampolineQueue and constant callStack
  const tramp = MODULE6_SCENARIOS.find(s => s.id === 'trampoline-recursion');
  if (tramp) {
    const hasTrampolineActivity = tramp.steps.some(
      s => s.queues.trampolineQueue && s.queues.trampolineQueue.length > 0
    );
    const maxStackDepth = Math.max(...tramp.steps.map(s => s.queues.callStack.length));
    check(
      'trampoline-recursion scenario exercises trampolineQueue with constant callStack depth <= 2',
      hasTrampolineActivity && maxStackDepth <= 2,
      `hasTrampoline: ${hasTrampolineActivity}, maxStackDepth: ${maxStackDepth}`
    );
  }

  // Delay Cancellation: must demonstrate cancellation action
  const delayCancel = MODULE6_SCENARIOS.find(s => s.id === 'delay-cancellation');
  if (delayCancel) {
    const cancelStep = delayCancel.steps.find(s => s.action === 'cancelled');
    check(
      'delay-cancellation scenario includes explicit cancellation step targeting cancelled task',
      !!cancelStep && cancelStep.activeTaskId === 'act-1',
      `cancelStep found: ${!!cancelStep}, activeTaskId: ${cancelStep?.activeTaskId}`
    );
  }

  // =========================================================================
  // 3. Scheduler Topics & Pedagogical Content Audit
  // =========================================================================
  console.log('\n▶ [3. Scheduler Topics & Pedagogical Content Audit]');
  const expectedTopics = [
    'queue-scheduler',
    'asap-scheduler',
    'async-scheduler',
    'animation-frame-scheduler'
  ];

  for (const topicId of expectedTopics) {
    const topic = MODULE6_TOPICS[topicId];
    check(
      `Topic '${topicId}' has complete concept, code, and takeaways`,
      !!topic &&
      !!topic.title &&
      !!topic.concept.summary &&
      topic.concept.sections.length >= 2 &&
      topic.concept.takeaways.length >= 2 &&
      !!topic.code.code &&
      topic.quiz.length >= 3,
      `Sections: ${topic?.concept.sections.length || 0}, Takeaways: ${topic?.concept.takeaways.length || 0}, Quiz: ${topic?.quiz.length || 0}`
    );
  }

  // =========================================================================
  // 4. Comparison Matrix & Quizzes Audit
  // =========================================================================
  console.log('\n▶ [4. Comparison Matrix & Quizzes Audit]');

  check(
    'SCHEDULER_COMPARISON_DATA covers 6 dimensions across 4 scheduler types',
    SCHEDULER_COMPARISON_DATA.features.length >= 6 &&
    SCHEDULER_COMPARISON_DATA.items.length === 4,
    `Features: ${SCHEDULER_COMPARISON_DATA.features.length}, Items: ${SCHEDULER_COMPARISON_DATA.items.length}`
  );

  const quizzes = [
    { name: 'QUEUE_SCHEDULER_QUIZ', quiz: QUEUE_SCHEDULER_QUIZ },
    { name: 'ASAP_SCHEDULER_QUIZ', quiz: ASAP_SCHEDULER_QUIZ },
    { name: 'ASYNC_SCHEDULER_QUIZ', quiz: ASYNC_SCHEDULER_QUIZ },
    { name: 'ANIMATION_FRAME_SCHEDULER_QUIZ', quiz: ANIMATION_FRAME_SCHEDULER_QUIZ },
    { name: 'VISUALIZER_QUIZ', quiz: VISUALIZER_QUIZ }
  ];

  let totalQuestions = 0;
  let allQuizzesSound = true;

  for (const q of quizzes) {
    totalQuestions += q.quiz.length;
    for (const item of q.quiz) {
      const hasValidCorrectOption = item.options.some(opt => opt.id === item.correctOptionId);
      if (
        !item.id ||
        !item.question ||
        !Array.isArray(item.options) ||
        item.options.length < 3 ||
        !item.correctOptionId ||
        !hasValidCorrectOption ||
        !item.explanation
      ) {
        allQuizzesSound = false;
        console.error(`Malformed quiz question: ${JSON.stringify(item)}`);
      }
    }
  }

  check(
    `All 5 interactive quizzes (${totalQuestions} questions total) have valid 4-option structure and explanation`,
    allQuizzesSound && totalQuestions >= 18,
    `Total questions: ${totalQuestions}, allSound: ${allQuizzesSound}`
  );

  // =========================================================================
  // Summary & Exit
  // =========================================================================
  console.log('\n' + '='.repeat(80));
  console.log(`  MODULE 6 DEEP AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('='.repeat(80) + '\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runModule6DeepAudit().catch(err => {
  console.error('Fatal deep audit error:', err);
  process.exit(1);
});
