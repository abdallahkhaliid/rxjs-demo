/**
 * Milestone 4 Adversarial Empirical Challenger Harness: Schedulers & Event Loop
 * 
 * Conducts stress tests, deep stack safety tests, strict event loop order verification,
 * action cancellation races, timer monotonicity, and simulator model audit.
 */

const {
  queueScheduler,
  asapScheduler,
  asyncScheduler,
  animationFrameScheduler,
  Subscription
} = require('rxjs');

// Polyfill requestAnimationFrame in Node.js test environment if missing
if (typeof global.requestAnimationFrame === 'undefined') {
  global.requestAnimationFrame = (callback) => {
    return setTimeout(() => callback(Date.now()), 16);
  };
}
if (typeof global.cancelAnimationFrame === 'undefined') {
  global.cancelAnimationFrame = (id) => {
    clearTimeout(id);
  };
}

const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function record(name, condition, details = '') {
  if (condition) {
    results.passed++;
    console.log(`  [PASS] ${name}${details ? ' — ' + details : ''}`);
  } else {
    results.failed++;
    console.error(`  [FAIL] ${name}${details ? ' — ' + details : ''}`);
  }
  results.tests.push({ name, passed: !!condition, details });
}

function getStackDepth() {
  const err = new Error();
  return (err.stack ? err.stack.split('\n').length : 0);
}

async function runAllChallengerTests() {
  console.log('='.repeat(80));
  console.log('  CHALLENGER M4-2: SCHEDULERS EVENT LOOP & ADVERSARIAL STRESS HARNESS');
  console.log('='.repeat(80) + '\n');

  // =========================================================================
  // Challenge Area 1: Strict Event Loop Ordering & Priority Races
  // =========================================================================
  console.log('▶ [Challenge 1: Event Loop Ordering & Priority Races]');

  // Test 1.1: Reverse registration order execution guarantee
  {
    const order = [];
    await new Promise(resolve => {
      // Registered in reverse order: async -> asap -> queue
      asyncScheduler.schedule(() => {
        order.push('macrotask');
        resolve();
      });

      asapScheduler.schedule(() => {
        order.push('microtask');
      });

      queueScheduler.schedule(() => {
        order.push('sync-queue');
      });

      order.push('sync-script-main');
    });

    const expected = ['sync-queue', 'sync-script-main', 'microtask', 'macrotask'];
    const matches = JSON.stringify(order) === JSON.stringify(expected);
    record(
      'Reverse registration execution order: queue (sync) -> script -> asap (microtask) -> async (macrotask)',
      matches,
      `Observed: ${JSON.stringify(order)}`
    );
  }

  // Test 1.2: Nested microtask drain priority over macrotask
  {
    const drainOrder = [];
    await new Promise(resolve => {
      asyncScheduler.schedule(() => {
        drainOrder.push('macrotask-1');
        resolve();
      });

      asapScheduler.schedule(() => {
        drainOrder.push('microtask-1');
        // Schedule nested microtask from within microtask
        asapScheduler.schedule(() => {
          drainOrder.push('microtask-2 (nested)');
          asapScheduler.schedule(() => {
            drainOrder.push('microtask-3 (doubly nested)');
          });
        });
      });
    });

    const expected = ['microtask-1', 'microtask-2 (nested)', 'microtask-3 (doubly nested)', 'macrotask-1'];
    const matches = JSON.stringify(drainOrder) === JSON.stringify(expected);
    record(
      'Nested microtasks drain completely before any macrotask executes',
      matches,
      `Observed: ${JSON.stringify(drainOrder)}`
    );
  }

  // Test 1.3: queueScheduler with delay > 0 automatically promotes to macrotask
  {
    const delayOrder = [];
    await new Promise(resolve => {
      queueScheduler.schedule(() => {
        delayOrder.push('delayed-queue');
        resolve();
      }, 15);

      asapScheduler.schedule(() => {
        delayOrder.push('asap-microtask');
      });

      queueScheduler.schedule(() => {
        delayOrder.push('immediate-queue');
      });
    });

    const expected = ['immediate-queue', 'asap-microtask', 'delayed-queue'];
    const matches = JSON.stringify(delayOrder) === JSON.stringify(expected);
    record(
      'queueScheduler with delay > 0 promotes to macrotask (runs after microtasks)',
      matches,
      `Observed: ${JSON.stringify(delayOrder)}`
    );
  }

  // =========================================================================
  // Challenge Area 2: Recursive Trampoline Deep Stack Safety
  // =========================================================================
  console.log('\n▶ [Challenge 2: Recursive Trampoline Deep Stack Safety]');

  // Test 2.1: Native recursive call stack boundary proof
  {
    let nativeCrashed = false;
    let maxNativeDepth = 0;
    try {
      function blowStack(n) {
        maxNativeDepth = n;
        blowStack(n + 1);
      }
      blowStack(1);
    } catch (e) {
      nativeCrashed = e instanceof RangeError;
    }
    record(
      `Native recursion crashes with RangeError at depth ${maxNativeDepth}`,
      nativeCrashed && maxNativeDepth > 1000,
      `Crash depth: ${maxNativeDepth}`
    );
  }

  // Test 2.2: queueScheduler survives 10,000 recursive schedules with zero stack growth
  {
    const TARGET_DEPTH = 10000;
    let executedCount = 0;
    let initialCallbackStack = 0;
    let maxStackObserved = 0;
    let depthSampleAt1000 = 0;
    let depthSampleAt10000 = 0;

    queueScheduler.schedule(function (depth) {
      executedCount++;
      const currentStack = getStackDepth();
      if (executedCount === 1) {
        initialCallbackStack = currentStack;
        maxStackObserved = currentStack;
      }
      if (currentStack > maxStackObserved) {
        maxStackObserved = currentStack;
      }
      if (depth === 1000) depthSampleAt1000 = currentStack;
      if (depth === TARGET_DEPTH) depthSampleAt10000 = currentStack;

      if (depth < TARGET_DEPTH) {
        this.schedule(depth + 1);
      }
    }, 0, 1);

    const stackGrowth = maxStackObserved - initialCallbackStack;
    record(
      `queueScheduler executes ${TARGET_DEPTH} recursive steps safely without stack growth`,
      executedCount === TARGET_DEPTH && stackGrowth === 0,
      `Executed: ${executedCount}, initialCallbackStack: ${initialCallbackStack}, maxStack: ${maxStackObserved}, sampleAt1k: ${depthSampleAt1000}, sampleAt10k: ${depthSampleAt10000}, stackGrowth: ${stackGrowth}`
    );
  }

  // Test 2.3: queueScheduler FIFO Trampoline queue ordering during multiple queueScheduler.schedule calls
  {
    const branchOrder = [];
    queueScheduler.schedule(() => {
      branchOrder.push('root');
      queueScheduler.schedule(() => {
        branchOrder.push('child-A');
        queueScheduler.schedule(() => branchOrder.push('leaf-A1'));
        queueScheduler.schedule(() => branchOrder.push('leaf-A2'));
      });
      queueScheduler.schedule(() => {
        branchOrder.push('child-B');
        queueScheduler.schedule(() => branchOrder.push('leaf-B1'));
        queueScheduler.schedule(() => branchOrder.push('leaf-B2'));
      });
    });

    const expectedBranch = ['root', 'child-A', 'child-B', 'leaf-A1', 'leaf-A2', 'leaf-B1', 'leaf-B2'];
    const matches = JSON.stringify(branchOrder) === JSON.stringify(expectedBranch);
    record(
      'queueScheduler processes multi-branch recursive schedules in strict FIFO order',
      matches,
      `Observed: ${JSON.stringify(branchOrder)}`
    );
  }

  // =========================================================================
  // Challenge Area 3: Action Cancellation & Race Integrity
  // =========================================================================
  console.log('\n▶ [Challenge 3: Action Cancellation & Race Integrity]');

  // Test 3.1: Heavy cancellation load: 100 actions scheduled, 50 cancelled
  {
    const TOTAL = 100;
    const executed = [];
    const subs = [];

    for (let i = 0; i < TOTAL; i++) {
      const sub = asyncScheduler.schedule(
        val => executed.push(val),
        15,
        i
      );
      subs.push(sub);
    }

    // Cancel all odd indexes immediately
    for (let i = 1; i < TOTAL; i += 2) {
      subs[i].unsubscribe();
    }

    await new Promise(r => setTimeout(r, 40));

    const expectedCount = 50;
    const onlyEvens = executed.every(n => n % 2 === 0);
    record(
      `Selective cancellation under load (50/100 aborted): zero cancelled actions execute`,
      executed.length === expectedCount && onlyEvens,
      `Executed count: ${executed.length}/${TOTAL}, all even: ${onlyEvens}`
    );
  }

  // Test 3.2: Immediate cancellation of zero-delay asyncScheduler
  {
    let immediateRan = false;
    const sub = asyncScheduler.schedule(() => {
      immediateRan = true;
    }, 0);
    sub.unsubscribe();

    await new Promise(r => setTimeout(r, 20));
    record(
      'Immediate unsubscribe() of zero-delay asyncScheduler action disarms execution before tick',
      immediateRan === false,
      `Fired: ${immediateRan}`
    );
  }

  // Test 3.3: Idempotent unsubscribe() does not throw or alter state
  {
    let thrown = false;
    const sub = asyncScheduler.schedule(() => {}, 50);
    try {
      sub.unsubscribe();
      sub.unsubscribe();
      sub.unsubscribe();
    } catch (e) {
      thrown = true;
    }
    record(
      'Repeated unsubscribe() calls on action subscription are idempotent and safe',
      thrown === false && sub.closed === true,
      `sub.closed: ${sub.closed}, thrown: ${thrown}`
    );
  }

  // Test 3.4: Cancellation from within callback of another action
  {
    let actionBRan = false;
    let actionBSub;

    await new Promise(resolve => {
      asyncScheduler.schedule(() => {
        // Action A cancels Action B
        actionBSub.unsubscribe();
        resolve();
      }, 10);

      actionBSub = asyncScheduler.schedule(() => {
        actionBRan = true;
      }, 25);
    });

    await new Promise(r => setTimeout(r, 35));
    record(
      'Action callback can safely cancel another pending scheduled action',
      actionBRan === false,
      `Action B executed: ${actionBRan}`
    );
  }

  // =========================================================================
  // Challenge Area 4: Time Delay Monotonicity & Parameter Precision
  // =========================================================================
  console.log('\n▶ [Challenge 4: Time Delay Monotonicity & Parameter Precision]');

  // Test 4.1: Monotonic ordering regardless of registration timing
  {
    const times = [];
    const delays = [80, 20, 60, 40, 100];
    const startTime = Date.now();

    await new Promise(resolve => {
      let completed = 0;
      for (const d of delays) {
        asyncScheduler.schedule(() => {
          times.push({ delay: d, elapsed: Date.now() - startTime });
          completed++;
          if (completed === delays.length) resolve();
        }, d);
      }
    });

    const recordedDelays = times.map(t => t.delay);
    const sortedDelays = [...delays].sort((a, b) => a - b);
    const orderPreserved = JSON.stringify(recordedDelays) === JSON.stringify(sortedDelays);
    record(
      'Actions execute in monotonic delay order [20, 40, 60, 80, 100] despite unordered registration',
      orderPreserved,
      `Execution order: ${recordedDelays.join(' -> ')}`
    );
  }

  // Test 4.2: Zero-delay asyncScheduler runs before positive delay asyncScheduler
  {
    const seq = [];
    await new Promise(resolve => {
      asyncScheduler.schedule(() => {
        seq.push('delay-15');
        resolve();
      }, 15);

      asyncScheduler.schedule(() => {
        seq.push('delay-0');
      }, 0);
    });

    const isCorrect = seq[0] === 'delay-0' && seq[1] === 'delay-15';
    record(
      'Zero-delay asyncScheduler action runs before delayed asyncScheduler action',
      isCorrect,
      `Observed: ${seq.join(' -> ')}`
    );
  }

  // =========================================================================
  // Challenge Area 5: animationFrameScheduler Behavior & Teardown
  // =========================================================================
  console.log('\n▶ [Challenge 5: animationFrameScheduler Behavior & Teardown]');

  // Test 5.1: Schedule and receive execution
  {
    let executed = false;
    await new Promise(resolve => {
      animationFrameScheduler.schedule(() => {
        executed = true;
        resolve();
      });
    });
    record(
      'animationFrameScheduler successfully schedules and executes callback',
      executed === true,
      `Executed: ${executed}`
    );
  }

  // Test 5.2: Multi-frame recursive scheduling with state
  {
    const frames = [];
    await new Promise(resolve => {
      animationFrameScheduler.schedule(function (frameNum) {
        frames.push(frameNum);
        if (frameNum < 5) {
          this.schedule(frameNum + 1);
        } else {
          resolve();
        }
      }, 0, 1);
    });

    const matches = JSON.stringify(frames) === JSON.stringify([1, 2, 3, 4, 5]);
    record(
      'animationFrameScheduler supports recursive multi-frame loop with state passing',
      matches,
      `Frames: ${frames.join(', ')}`
    );
  }

  // Test 5.3: animationFrame cancellation
  {
    let cancelledFired = false;
    const sub = animationFrameScheduler.schedule(() => {
      cancelledFired = true;
    });
    sub.unsubscribe();

    await new Promise(r => setTimeout(r, 40));
    record(
      'animationFrameScheduler action cancellation via unsubscribe() disarms execution',
      cancelledFired === false,
      `Fired: ${cancelledFired}`
    );
  }

  // =========================================================================
  // Challenge Area 6: Error Resilience & State Non-Corruption
  // =========================================================================
  console.log('\n▶ [Challenge 6: Error Resilience & State Non-Corruption]');

  // Test 6.1: Exception in queueScheduler action does not corrupt subsequent calls
  {
    let errorCaught = false;
    try {
      queueScheduler.schedule(() => {
        throw new Error('Challenger intentional error in queueScheduler');
      });
    } catch (e) {
      errorCaught = true;
    }

    let postActionRan = false;
    queueScheduler.schedule(() => {
      postActionRan = true;
    });

    record(
      'queueScheduler re-arms correctly and executes subsequent actions after an action throws',
      errorCaught && postActionRan,
      `errorCaught: ${errorCaught}, postActionRan: ${postActionRan}`
    );
  }

  // Test 6.2: State passing retains object integrity
  {
    const testPayload = { id: 'm4-payload', count: 42, nested: { flag: true } };
    let receivedState = null;

    queueScheduler.schedule(function (state) {
      receivedState = state;
    }, 0, testPayload);

    record(
      'queueScheduler passes complex state payload intact without mutation',
      receivedState !== null && receivedState.id === 'm4-payload' && receivedState.nested.flag === true,
      `Received: ${JSON.stringify(receivedState)}`
    );
  }

  // =========================================================================
  // Summary & Verdict
  // =========================================================================
  console.log('\n' + '='.repeat(80));
  console.log('  CHALLENGER SUITE SUMMARY');
  console.log('='.repeat(80));
  console.log(`  Total Tests : ${results.passed + results.failed}`);
  console.log(`  Passed      : ${results.passed}`);
  console.log(`  Failed      : ${results.failed}`);
  console.log('='.repeat(80) + '\n');

  if (results.failed > 0) {
    process.exit(1);
  }
}

runAllChallengerTests().catch(err => {
  console.error('Fatal challenger execution error:', err);
  process.exit(1);
});
