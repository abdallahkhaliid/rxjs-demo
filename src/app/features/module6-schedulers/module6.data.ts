import { ComparisonData, ConsoleEntry, QuizQuestion } from '../../core/models';
import {
  SchedulerTopicConfig,
  SimulationScenario,
  SimulationStep,
  TaskItem
} from './module6.models';

// Helper to create console entries
let entryCounter = 0;
function createEntry(type: 'info' | 'next' | 'complete' | 'error', text: string): ConsoleEntry {
  entryCounter++;
  return {
    id: `log-${entryCounter}-${Date.now()}`,
    timestamp: Date.now(),
    relativeMs: entryCounter * 12,
    type,
    value: text,
    description: text
  };
}

export const SCHEDULER_COMPARISON_DATA: ComparisonData = {
  features: [
    { id: 'phase', label: 'Event Loop Phase', description: 'When scheduled work executes in the browser event loop' },
    { id: 'mechanism', label: 'Underlying Mechanism', description: 'Web API / JS engine mechanism used for scheduling' },
    { id: 'delaySupport', label: 'Delay (ms) Support', description: 'Ability to schedule actions in the future with delay parameter' },
    { id: 'recursionSafety', label: 'Recursive Behavior', description: 'How nested scheduling behaves regarding stack and loop starvation' },
    { id: 'cancellation', label: 'Cancellation', description: 'Support for aborting scheduled actions via Subscription.unsubscribe()' },
    { id: 'primaryUse', label: 'Primary Use Case', description: 'Where and why to choose this scheduler in production code' }
  ],
  items: [
    {
      id: 'queue',
      name: 'queueScheduler',
      badge: 'Synchronous Trampoline',
      recommendedUse: 'Synchronous iteration, state passing, and preventing call stack overflow in recursive streams.',
      characteristics: {
        phase: { text: 'Synchronous (Current Frame)', status: 'positive' },
        mechanism: { text: 'Trampoline Queue (while-loop)', status: 'positive' },
        delaySupport: { text: 'Only if delay=0 (delegates to async if delay > 0)', status: 'neutral' },
        recursionSafety: { text: '100% Stack-Safe (flattens recursion into FIFO iteration)', status: 'positive' },
        cancellation: { text: 'Supported via Subscription.unsubscribe()', status: 'positive' },
        primaryUse: { text: 'Array iteration, deep recursive emissions without call stack overflow', status: 'positive' }
      }
    },
    {
      id: 'asap',
      name: 'asapScheduler',
      badge: 'Microtask Queue',
      recommendedUse: 'High-priority asynchronous dispatch after current stack frame, before browser render.',
      characteristics: {
        phase: { text: 'Microtask Queue (Post-Call Stack)', status: 'positive' },
        mechanism: { text: 'queueMicrotask / Promise.resolve() / MutationObserver', status: 'positive' },
        delaySupport: { text: 'Delay=0 (delegates to async if delay > 0)', status: 'neutral' },
        recursionSafety: { text: 'Recursive scheduling will starve macrotasks & render!', status: 'negative' },
        cancellation: { text: 'Supported via Subscription.unsubscribe()', status: 'positive' },
        primaryUse: { text: 'Immediate asynchronous callbacks, promise coordination, non-blocking UI notifications', status: 'positive' }
      }
    },
    {
      id: 'async',
      name: 'asyncScheduler',
      badge: 'Macrotask Queue',
      recommendedUse: 'Time-delayed operations, periodic intervals, and cooperative multitasking on macrotask queue.',
      characteristics: {
        phase: { text: 'Macrotask Queue (Timer Phase)', status: 'positive' },
        mechanism: { text: 'setTimeout / setInterval', status: 'positive' },
        delaySupport: { text: 'Full support: 0ms up to hours/days with millisecond precision', status: 'positive' },
        recursionSafety: { text: 'Safe: Yields control back to browser event loop between iterations', status: 'positive' },
        cancellation: { text: 'Supported via clearTimeout / clearInterval abstraction', status: 'positive' },
        primaryUse: { text: 'Debounce/throttle timers, polling intervals, delayed retry, non-blocking UI chunks', status: 'positive' }
      }
    },
    {
      id: 'animation-frame',
      name: 'animationFrameScheduler',
      badge: 'Render / Vsync Queue',
      recommendedUse: 'Smooth UI animations, canvas rendering, and 60fps/120fps synchronized visual updates.',
      characteristics: {
        phase: { text: 'Render Frame Phase (Pre-Paint Vsync)', status: 'positive' },
        mechanism: { text: 'window.requestAnimationFrame (rAF)', status: 'positive' },
        delaySupport: { text: 'Synchronized with display refresh rate (~16.6ms at 60Hz)', status: 'positive' },
        recursionSafety: { text: 'Safe: executes at most once per browser paint frame', status: 'positive' },
        cancellation: { text: 'Supported via cancelAnimationFrame', status: 'positive' },
        primaryUse: { text: 'CSS/Canvas animations, scroll position tracking, DOM measurement, game loops', status: 'positive' }
      }
    }
  ]
};

// Quizzes
export const QUEUE_SCHEDULER_QUIZ: QuizQuestion[] = [
  {
    id: 'queue-1',
    question: 'How does queueScheduler handle recursive scheduling when delay is 0?',
    options: [
      { id: 'a', text: 'It pushes new call frames onto the native JavaScript call stack, leading to RangeError if depth > 10,000.' },
      { id: 'b', text: 'It uses a trampoline queue: subsequent calls are queued in an internal array and processed sequentially in a while-loop.' },
      { id: 'c', text: 'It delegates the recursive calls to setTimeout(0).' },
      { id: 'd', text: 'It drops recursive calls to prevent deadlocks.' }
    ],
    correctOptionId: 'b',
    explanation: 'The trampoline mechanism queues scheduled actions internally and iterates over them in a flat while-loop, eliminating call stack growth.'
  },
  {
    id: 'queue-2',
    question: 'What happens if you invoke queueScheduler.schedule(action, 100) with a delay > 0?',
    options: [
      { id: 'a', text: 'It throws an UnsupportedOperationError.' },
      { id: 'b', text: 'It blocks the thread synchronously for 100 milliseconds.' },
      { id: 'c', text: 'It delegates the scheduling to asyncScheduler to handle the time delay.' },
      { id: 'd', text: 'It ignores the delay and executes synchronously immediately.' }
    ],
    correctOptionId: 'c',
    explanation: 'When a delay > 0 is passed to queueScheduler, RxJS transparently forwards the work to asyncScheduler.'
  },
  {
    id: 'queue-3',
    question: 'In what order will the following code log output?\n\nconsole.log(1);\nqueueScheduler.schedule(() => console.log(2));\nconsole.log(3);',
    options: [
      { id: 'a', text: '1, 3, 2 (asynchronous)' },
      { id: 'b', text: '1, 2, 3 (synchronous)' },
      { id: 'c', text: '2, 1, 3' },
      { id: 'd', text: 'Undefined order depending on CPU load' }
    ],
    correctOptionId: 'b',
    explanation: 'queueScheduler executes synchronously when there is no currently running trampoline action, so it logs 1, 2, 3 in exact lexical sequence.'
  },
  {
    id: 'queue-4',
    question: 'Which argument allows you to pass recursive state into the scheduled action without closure allocations?',
    options: [
      { id: 'a', text: 'The third parameter: scheduler.schedule(workFn, delay, state)' },
      { id: 'b', text: 'A global variable or Subject' },
      { id: 'c', text: 'RxJS does not support state passing in schedulers' },
      { id: 'd', text: 'The state must be bound using Function.prototype.bind' }
    ],
    correctOptionId: 'a',
    explanation: 'The signature is schedule(work, delay?, state?). The state object is passed directly to the work callback: function(state) { ... }.'
  }
];

export const ASAP_SCHEDULER_QUIZ: QuizQuestion[] = [
  {
    id: 'asap-1',
    question: 'Which JavaScript concurrency queue does asapScheduler utilize for scheduling with delay=0?',
    options: [
      { id: 'a', text: 'Macrotask Queue (Timer Task)' },
      { id: 'b', text: 'Microtask Queue (Promise / queueMicrotask)' },
      { id: 'c', text: 'Pre-render Animation Frame Queue' },
      { id: 'd', text: 'Synchronous Call Stack Trampoline' }
    ],
    correctOptionId: 'b',
    explanation: 'asapScheduler dispatches as fast as possible ("as soon as possible") via the JavaScript microtask queue, which executes immediately after the current call stack empties and before browser repaint.'
  },
  {
    id: 'asap-2',
    question: 'What is the danger of scheduling recursive asapScheduler actions in an infinite loop?',
    options: [
      { id: 'a', text: 'Maximum call stack size exceeded' },
      { id: 'b', text: 'Microtask starvation: it prevents macrotasks, UI rendering, and user input events from ever running' },
      { id: 'c', text: 'The browser drops microtasks after 100 iterations' },
      { id: 'd', text: 'Memory leak due to unsubscribed Subject' }
    ],
    correctOptionId: 'b',
    explanation: 'The event loop will continuously drain microtasks until the microtask queue is empty before giving control to render or macrotasks. An infinite microtask loop completely freezes the browser UI.'
  },
  {
    id: 'asap-3',
    question: 'If two asapScheduler tasks are scheduled sequentially, in what order do they execute?',
    options: [
      { id: 'a', text: 'Strictly FIFO (First-In, First-Out)' },
      { id: 'b', text: 'LIFO (Last-In, First-Out)' },
      { id: 'c', text: 'Parallel concurrent execution' },
      { id: 'd', text: 'Random order depending on Promise resolution' }
    ],
    correctOptionId: 'a',
    explanation: 'The microtask queue guarantees strict FIFO ordering. The first scheduled microtask executes first.'
  },
  {
    id: 'asap-4',
    question: 'Compared to asyncScheduler, when does asapScheduler execute?',
    options: [
      { id: 'a', text: 'After the next setTimeout callback' },
      { id: 'b', text: 'Before any pending macrotask (setTimeout/setInterval) callback executes' },
      { id: 'c', text: 'At the exact same time' },
      { id: 'd', text: 'Only after user clicks the mouse' }
    ],
    correctOptionId: 'b',
    explanation: 'The microtask queue is always drained completely after each task and before the next macrotask is dequeued.'
  }
];

export const ASYNC_SCHEDULER_QUIZ: QuizQuestion[] = [
  {
    id: 'async-1',
    question: 'What underlying JavaScript Web API does asyncScheduler use for time-delayed tasks?',
    options: [
      { id: 'a', text: 'requestAnimationFrame' },
      { id: 'b', text: 'setTimeout / setInterval' },
      { id: 'c', text: 'queueMicrotask' },
      { id: 'd', text: 'Web Workers postMessage' }
    ],
    correctOptionId: 'b',
    explanation: 'asyncScheduler wraps setTimeout and setInterval to handle delayed actions on the macrotask queue.'
  },
  {
    id: 'async-2',
    question: 'How can you cancel an asyncScheduler action before its delay expires?',
    options: [
      { id: 'a', text: 'By calling action.unsubscribe() on the Subscription returned by schedule()' },
      { id: 'b', text: 'By calling asyncScheduler.stop()' },
      { id: 'c', text: 'Scheduled actions cannot be cancelled once queued' },
      { id: 'd', text: 'By throwing an error inside window.onerror' }
    ],
    correctOptionId: 'a',
    explanation: 'schedule() returns a Subscription (an Action object). Calling action.unsubscribe() disarms the underlying timer.'
  },
  {
    id: 'async-3',
    question: 'Can asyncScheduler be used to implement a recurring interval without native setInterval drift?',
    options: [
      { id: 'a', text: 'No, it only supports one-shot delays' },
      { id: 'b', text: 'Yes, by calling this.schedule(state + 1, delay) inside the action function' },
      { id: 'c', text: 'Only when combined with animationFrameScheduler' },
      { id: 'd', text: 'Only inside an Angular NgZone.runOutsideAngular block' }
    ],
    correctOptionId: 'b',
    explanation: 'Inside the scheduled action, this.schedule(state, delay) re-schedules the action, forming a controllable, self-rescheduling timer loop.'
  },
  {
    id: 'async-4',
    question: 'If a scheduled action throws an uncaught error, what happens to the asyncScheduler instance?',
    options: [
      { id: 'a', text: 'The scheduler instance is corrupted and cannot schedule future tasks' },
      { id: 'b', text: 'The scheduler remains intact and can continue scheduling future actions normally' },
      { id: 'c', text: 'The entire application terminates immediately' },
      { id: 'd', text: 'All active subscriptions across all operators are automatically disposed' }
    ],
    correctOptionId: 'b',
    explanation: 'RxJS scheduler actions execute in isolated try/catch boundaries; an error in one action does not compromise the scheduler engine.'
  }
];

export const ANIMATION_FRAME_SCHEDULER_QUIZ: QuizQuestion[] = [
  {
    id: 'anim-1',
    question: 'What is the primary advantage of animationFrameScheduler over asyncScheduler for UI transitions?',
    options: [
      { id: 'a', text: 'It executes in Web Workers for multithreaded rendering' },
      { id: 'b', text: 'It syncs callbacks with the browser display refresh cycle (vsync), preventing visual stutter and tearing' },
      { id: 'c', text: 'It runs at 1000fps regardless of monitor hardware' },
      { id: 'd', text: 'It bypasses the JavaScript single-thread model' }
    ],
    correctOptionId: 'b',
    explanation: 'window.requestAnimationFrame coordinates execution with the browser refresh rate (~60fps = 16.6ms, ~120fps = 8.3ms), avoiding frame drops caused by timer drift.'
  },
  {
    id: 'anim-2',
    question: 'What happens to animationFrameScheduler callbacks when the user switches to a background browser tab?',
    options: [
      { id: 'a', text: 'They continue executing at 60fps' },
      { id: 'b', text: 'The browser throttles or pauses requestAnimationFrame execution to conserve battery and CPU resources' },
      { id: 'c', text: 'The application crashes with TabInactiveException' },
      { id: 'd', text: 'They automatically convert into Promise microtasks' }
    ],
    correctOptionId: 'b',
    explanation: 'Browsers pause or severely throttle requestAnimationFrame in inactive background tabs to save battery and compute cycles.'
  },
  {
    id: 'anim-3',
    question: 'How does animationFrameScheduler handle environments where requestAnimationFrame is unavailable (like Node.js / SSR)?',
    options: [
      { id: 'a', text: 'It throws a ReferenceError: window is not defined' },
      { id: 'b', text: 'It falls back gracefully to asyncScheduler (setTimeout)' },
      { id: 'c', text: 'It silently discards all scheduled emissions' },
      { id: 'd', text: 'It blocks execution until window is defined' }
    ],
    correctOptionId: 'b',
    explanation: 'RxJS detects the lack of requestAnimationFrame and falls back to asyncScheduler / setTimeout automatically.'
  },
  {
    id: 'anim-4',
    question: 'In the browser event loop phase sequence, when does the render phase occur relative to microtasks and macrotasks?',
    options: [
      { id: 'a', text: 'Before any microtasks run' },
      { id: 'b', text: 'After the microtask queue is emptied and before the browser paints pixels to the screen' },
      { id: 'c', text: 'Only once every hour' },
      { id: 'd', text: 'Simultaneously on a separate OS thread' }
    ],
    correctOptionId: 'b',
    explanation: 'The event loop drains microtasks first, then before repainting, fires requestAnimationFrame callbacks, renders UI, and finally picks the next macrotask.'
  }
];

export const VISUALIZER_QUIZ: QuizQuestion[] = [
  {
    id: 'vis-1',
    question: 'What is the correct event loop execution order for queue, asap, and async schedulers scheduled in the same script block?',
    options: [
      { id: 'a', text: '1. async (macrotask) -> 2. asap (microtask) -> 3. queue (sync)' },
      { id: 'b', text: '1. queue (sync) -> 2. asap (microtask) -> 3. async (macrotask)' },
      { id: 'c', text: '1. asap (microtask) -> 2. queue (sync) -> 3. async (macrotask)' },
      { id: 'd', text: 'All 3 execute simultaneously in parallel' }
    ],
    correctOptionId: 'b',
    explanation: 'Synchronous trampoline (queue) executes inline, followed by microtask queue drain (asap), followed by the macrotask queue (async).'
  },
  {
    id: 'vis-2',
    question: 'What is the Call Stack in the JavaScript Concurrency Model?',
    options: [
      { id: 'a', text: 'A FIFO queue where setTimeout timers wait' },
      { id: 'b', text: 'A LIFO execution frame structure tracking current function calls and return addresses' },
      { id: 'c', text: 'A heap memory pool storing RxJS Observables' },
      { id: 'd', text: 'A browser cache for compiled WebAssembly modules' }
    ],
    correctOptionId: 'b',
    explanation: 'The call stack is a Last-In, First-Out (LIFO) structure holding the execution context of active JavaScript functions.'
  },
  {
    id: 'vis-3',
    question: 'Why does queueScheduler prevent Maximum Call Stack Size Exceeded errors during deep recursion?',
    options: [
      { id: 'a', text: 'It creates a Web Worker thread for each iteration' },
      { id: 'b', text: 'It unwinds the stack by pushing state onto an internal trampoline array and iterating in a while-loop' },
      { id: 'c', text: 'It uses async/await internally' },
      { id: 'd', text: 'It compresses function arguments into 1 byte' }
    ],
    correctOptionId: 'b',
    explanation: 'The trampoline pattern flattens recursion into sequential iterations inside a single call stack frame.'
  },
  {
    id: 'vis-4',
    question: 'What happens between the end of microtask queue processing and the execution of the next macrotask?',
    options: [
      { id: 'a', text: 'The browser may execute the render phase (requestAnimationFrame, style calculation, layout, paint)' },
      { id: 'b', text: 'All event listeners are detached' },
      { id: 'c', text: 'The CPU enters deep sleep for 100ms' },
      { id: 'd', text: 'JavaScript garbage collection halts the entire machine' }
    ],
    correctOptionId: 'a',
    explanation: 'If a render opportunity exists (aligned with display refresh ~16ms), the browser executes render callbacks (rAF) and paints before picking the next macrotask.'
  }
];

// Topic Configurations for the 4 Schedulers
export const MODULE6_TOPICS: Record<string, SchedulerTopicConfig> = {
  'queue-scheduler': {
    id: 'queue-scheduler',
    title: 'queueScheduler',
    subtitle: 'Synchronous Trampoline Execution & Stack-Overflow Protection',
    category: 'Schedulers',
    difficulty: 'intermediate',
    schedulerType: 'queue',
    concept: {
      summary: 'The queueScheduler schedules tasks synchronously on a trampoline queue. When used for recursion, instead of blowing the native JavaScript call stack with thousands of nested function frames, it enqueues the recursive iterations on a flat internal list and processes them sequentially in a while-loop.',
      pillarsTitle: 'Core Capabilities',
      pillars: [
        {
          title: 'Trampoline Queue',
          description: 'Flattens deep recursion into a linear loop, completely eliminating RangeError: Maximum call stack size exceeded.'
        },
        {
          title: 'Synchronous Dispatch',
          description: 'When delay is 0 and no task is currently running, executes immediately on the current stack frame.'
        },
        {
          title: 'State Passing',
          description: 'Accepts a third state argument that is passed cleanly into the action callback without allocating closures.'
        }
      ],
      sections: [
        {
          title: 'Understanding the Trampoline Pattern',
          content: 'In classic recursion, each invocation adds an execution context to the call stack until memory is exhausted. The queueScheduler checks if an action is currently executing. If so, subsequent schedule() calls simply push the work onto a FIFO array. Once the current action finishes, the while loop dequeues and executes the next item at stack depth 1.'
        },
        {
          title: 'When to Use queueScheduler',
          content: 'Ideal for operators that need synchronous execution but might process huge collections (such as range(), from(), or deeply recursive state machines) where normal recursion would trigger stack overflow.'
        }
      ],
      takeaways: [
        'Executes synchronously if delay is 0 and the trampoline is empty.',
        'Recursive calls within an action are queued on the trampoline, keeping stack depth constant.',
        'If delay > 0 is provided, it transparently delegates to asyncScheduler.',
        'Supports clean state passing via scheduler.schedule(action, 0, state).'
      ]
    },
    code: {
      title: 'queue-scheduler-trampoline.ts',
      language: 'typescript',
      highlightLines: [4, 7, 8, 9],
      code: `import { queueScheduler } from 'rxjs';

// Safe recursion over 30 levels without call stack growth
console.log('--- Start Trampoline ---');

queueScheduler.schedule(function (state) {
  console.log(\`Level \${state} executed at stack depth 1\`);

  if (state < 5) {
    // Queues on internal trampoline instead of adding call stack frame!
    this.schedule(state + 1);
  }
}, 0, 1);

console.log('--- End Trampoline ---');
// Output:
// --- Start Trampoline ---
// Level 1 executed at stack depth 1
// Level 2 executed at stack depth 1
// Level 3 executed at stack depth 1
// Level 4 executed at stack depth 1
// Level 5 executed at stack depth 1
// --- End Trampoline ---`
    },
    comparison: SCHEDULER_COMPARISON_DATA,
    quiz: QUEUE_SCHEDULER_QUIZ,
    demo: {
      title: 'Trampoline Recursion Runner',
      description: 'Adjust the recursion depth slider (1-30) and observe how queueScheduler maintains stack depth 1 without overflowing the JavaScript call stack.'
    }
  },

  'asap-scheduler': {
    id: 'asap-scheduler',
    title: 'asapScheduler',
    subtitle: 'High-Priority Asynchronous Dispatch on the Microtask Queue',
    category: 'Schedulers',
    difficulty: 'advanced',
    schedulerType: 'asap',
    concept: {
      summary: 'The asapScheduler schedules tasks to run asynchronously "as soon as possible" on the JavaScript microtask queue. It runs immediately after the current synchronous code block finishes, but before the browser performs layout, paint, or dequeues macrotasks like setTimeout.',
      pillarsTitle: 'Microtask Architecture',
      pillars: [
        {
          title: 'Microtask Queue',
          description: 'Leverages queueMicrotask / Promise.resolve() to guarantee execution immediately after the current call stack clears.'
        },
        {
          title: 'Pre-Paint Dispatch',
          description: 'Executes before the browser renders visual updates or accepts new macrotasks, perfect for synchronous state batching.'
        },
        {
          title: 'Strict FIFO Order',
          description: 'Multiple asapScheduler tasks are queued and drained in exact chronological order without priority inversion.'
        }
      ],
      sections: [
        {
          title: 'The Microtask vs Macrotask Distinction',
          content: 'JavaScript processes the event loop in turns. Each turn executes the current call stack to completion, then exhausts the entire microtask queue before considering rendering or the macrotask queue. asapScheduler taps directly into this high-priority phase.'
        },
        {
          title: 'Risk: Microtask Starvation',
          content: 'Because the event loop will not proceed to paint or macrotasks until the microtask queue is completely empty, an infinite loop of asapScheduler.schedule(() => this.schedule()) will starve the main thread, resulting in a frozen browser UI.'
        }
      ],
      takeaways: [
        'Runs on the microtask queue (same priority as resolved Promises and MutationObserver).',
        'Executes after synchronous code, but before setTimeout/setInterval (macrotasks) and DOM paint.',
        'Multiple tasks execute in strict FIFO order.',
        'Use for time-critical asynchronous state updates that must complete before user paint.'
      ]
    },
    code: {
      title: 'asap-scheduler-microtask.ts',
      language: 'typescript',
      highlightLines: [3, 8, 11],
      code: `import { asapScheduler, asyncScheduler } from 'rxjs';

console.log('1. Script synchronous start');

asyncScheduler.schedule(() => {
  console.log('4. asyncScheduler (Macrotask / setTimeout)');
});

asapScheduler.schedule(() => {
  console.log('3. asapScheduler (Microtask / queueMicrotask)');
});

console.log('2. Script synchronous end');

// Output order:
// 1. Script synchronous start
// 2. Script synchronous end
// 3. asapScheduler (Microtask / queueMicrotask)
// 4. asyncScheduler (Macrotask / setTimeout)`
    },
    comparison: SCHEDULER_COMPARISON_DATA,
    quiz: ASAP_SCHEDULER_QUIZ,
    demo: {
      title: 'Microtask Drain Playground',
      description: 'Dispatch synchronous logs, microtasks (asap), and macrotasks (async) to witness how the JavaScript engine drains the microtask queue before macrotasks.'
    }
  },

  'async-scheduler': {
    id: 'async-scheduler',
    title: 'asyncScheduler',
    subtitle: 'Macrotask Execution, Time Delays & Action Cancellation',
    category: 'Schedulers',
    difficulty: 'intermediate',
    schedulerType: 'async',
    concept: {
      summary: 'The asyncScheduler schedules tasks on the JavaScript macrotask queue using setTimeout and setInterval. It is the workhorse scheduler for timed operations like delay(), debounceTime(), throttleTime(), timer(), and interval().',
      pillarsTitle: 'Core Capabilities',
      pillars: [
        {
          title: 'Millisecond Delays',
          description: 'Supports scheduling actions in the future with millisecond precision (e.g. schedule(action, 250)).'
        },
        {
          title: 'Clean Cancellation',
          description: 'Calling unsubscribe() on the returned action subscription aborts the pending timer before it fires.'
        },
        {
          title: 'Recurring Timers',
          description: 'Supports re-scheduling inside the action function to create cooperative non-blocking loops.'
        }
      ],
      sections: [
        {
          title: 'Macrotask Execution Model',
          content: 'Each macrotask represents an isolated task dispatched by the browser timer subsystem. Between macrotasks, the browser can handle user input, update layout, and run GC cycles, ensuring the UI remains fluid.'
        },
        {
          title: 'Cancellation Mechanics',
          content: 'When asyncScheduler.schedule() is invoked with delay, RxJS creates an AsyncAction holding a browser timer id. Calling action.unsubscribe() immediately invokes clearTimeout / clearInterval, ensuring zero memory leaks or phantom executions.'
        }
      ],
      takeaways: [
        'Dispatches via setTimeout / setInterval on the macrotask queue.',
        'Full support for time delays (e.g., 50ms, 1000ms).',
        'Aborted cleanly with action.unsubscribe() before the delay elapses.',
        'Isolated execution boundary: errors in one task do not break the scheduler.'
      ]
    },
    code: {
      title: 'async-scheduler-delayed.ts',
      language: 'typescript',
      highlightLines: [4, 9, 13],
      code: `import { asyncScheduler } from 'rxjs';

console.log('Scheduling delayed actions...');

const action = asyncScheduler.schedule(() => {
  console.log('Action executed after 500ms delay!');
}, 500);

// If we need to abort before 500ms:
// action.unsubscribe();
// console.log('Action cancelled before execution!');

// Periodic recurrence via state:
asyncScheduler.schedule(function (count) {
  console.log(\`Tick #\${count}\`);
  if (count < 3) {
    this.schedule(count + 1, 1000); // schedule next tick in 1s
  }
}, 1000, 1);`
    },
    comparison: SCHEDULER_COMPARISON_DATA,
    quiz: ASYNC_SCHEDULER_QUIZ,
    demo: {
      title: 'Delay & Cancellation Runner',
      description: 'Configure delay (0 - 2000ms), schedule the action, and test cancelling via unsubscribe() before the timer elapses.'
    }
  },

  'animation-frame-scheduler': {
    id: 'animation-frame-scheduler',
    title: 'animationFrameScheduler',
    subtitle: 'Synchronized 60 FPS Browser Vsync Rendering',
    category: 'Schedulers',
    difficulty: 'advanced',
    schedulerType: 'animation-frame',
    concept: {
      summary: 'The animationFrameScheduler schedules tasks to run right before the browser performs its next paint via window.requestAnimationFrame. It coordinates emissions with the monitor refresh rate (typically 60Hz or 120Hz), delivering buttery smooth animations without timer stutter.',
      pillarsTitle: 'Display Synchronization',
      pillars: [
        {
          title: 'Vsync Synchronization',
          description: 'Fires in lockstep with the display refresh cycle (~16.6ms at 60Hz, ~8.3ms at 120Hz), eliminating tearing.'
        },
        {
          title: 'Power Efficiency',
          description: 'The browser automatically pauses animationFrame callbacks in inactive tabs, conserving laptop battery.'
        },
        {
          title: 'Jitter-Free Transforms',
          description: 'Avoids the frame-dropping and micro-stutters inherent in standard setTimeout and setInterval timers.'
        }
      ],
      sections: [
        {
          title: 'The Render Pipeline',
          content: 'Modern browsers update the screen at hardware refresh intervals. The render pipeline executes: Microtasks -> requestAnimationFrame callbacks -> Style recalculation -> Layout (reflow) -> Paint -> Composite. animationFrameScheduler places your code precisely at the start of this pipeline.'
        },
        {
          title: 'Fallback in SSR / Node.js',
          content: 'When requestAnimationFrame is undefined (such as during server-side rendering in Angular SSR), RxJS automatically falls back to asyncScheduler (setTimeout), guaranteeing zero runtime crashes.'
        }
      ],
      takeaways: [
        'Uses window.requestAnimationFrame under the hood.',
        'Runs once per visual frame directly before browser layout and paint.',
        'Throttled automatically by the browser when the tab is hidden.',
        'Ideal for canvas animations, drag-and-drop coordinates, and smooth physics.'
      ]
    },
    code: {
      title: 'animation-frame-smooth.ts',
      language: 'typescript',
      highlightLines: [4, 8, 13],
      code: `import { animationFrameScheduler } from 'rxjs';

console.log('Starting 60fps frame loop...');

const startTimestamp = performance.now();

animationFrameScheduler.schedule(function (frameIndex) {
  const elapsed = performance.now() - startTimestamp;
  console.log(\`Frame #\${frameIndex}: \${elapsed.toFixed(1)}ms elapsed\`);

  // Move animated element smoothly:
  // element.style.transform = \`translateX(\${frameIndex * 2}px)\`;

  if (frameIndex < 60) {
    // Schedule for next vsync paint frame
    this.schedule(frameIndex + 1);
  }
}, 0, 1);`
    },
    comparison: SCHEDULER_COMPARISON_DATA,
    quiz: ANIMATION_FRAME_SCHEDULER_QUIZ,
    demo: {
      title: '60 FPS Frame Rate Visualizer',
      description: 'Compare the buttery-smooth transform of an element animated via animationFrameScheduler against a standard interval timer.'
    }
  }
};

// 5 Deterministic Simulation Scenarios for EventLoopSimulatorService
export const MODULE6_SCENARIOS: SimulationScenario[] = [
  // Scenario 1: Mixed Concurrency Showdown
  {
    id: 'mixed-concurrency',
    name: 'Mixed Concurrency Showdown',
    badge: 'Sync vs Micro vs Render vs Macro',
    description: 'The ultimate event loop race: synchronous code, queueScheduler, asapScheduler, animationFrameScheduler, and asyncScheduler scheduled in the same turn.',
    codeSnippet: `console.log('1. Script Start (Sync)');
asyncScheduler.schedule(() => console.log('5. asyncScheduler (Macrotask)'));
asapScheduler.schedule(() => console.log('3. asapScheduler (Microtask)'));
queueScheduler.schedule(() => console.log('2. queueScheduler (Sync Trampoline)'));
animationFrameScheduler.schedule(() => console.log('4. animationFrame (Render)'));
console.log('2.5. Script End (Sync)');`,
    steps: [
      {
        stepNumber: 0,
        phase: 'synchronous',
        phaseTitle: 'Synchronous Evaluation',
        action: 'dequeue_to_stack',
        activeTaskId: 'main',
        codeLineHighlight: 1,
        queues: {
          callStack: [{ id: 'main', name: 'main()', scheduler: 'sync', status: 'active' }],
          trampolineQueue: [],
          microtaskQueue: [],
          macrotaskQueue: [],
          renderQueue: []
        },
        explanation: 'JavaScript engine starts executing main() script on the Call Stack.',
        consoleOutput: []
      },
      {
        stepNumber: 1,
        phase: 'synchronous',
        phaseTitle: 'Synchronous Evaluation',
        action: 'output_logged',
        activeTaskId: 'main',
        codeLineHighlight: 1,
        queues: {
          callStack: [
            { id: 'main', name: 'main()', scheduler: 'sync', status: 'active' },
            { id: 'log1', name: 'console.log()', scheduler: 'sync', status: 'active' }
          ],
          trampolineQueue: [],
          microtaskQueue: [],
          macrotaskQueue: [],
          renderQueue: []
        },
        explanation: 'Line 1: console.log emits immediately to stdout.',
        consoleOutput: [createEntry('info', '1. Script Start (Sync)')]
      },
      {
        stepNumber: 2,
        phase: 'synchronous',
        phaseTitle: 'Synchronous Evaluation',
        action: 'enqueue',
        activeTaskId: 'task-async',
        codeLineHighlight: 2,
        queues: {
          callStack: [{ id: 'main', name: 'main()', scheduler: 'sync', status: 'active' }],
          trampolineQueue: [],
          microtaskQueue: [],
          macrotaskQueue: [
            { id: 'task-async', name: 'asyncScheduler Task', scheduler: 'async', delayMs: 0, status: 'pending' }
          ],
          renderQueue: []
        },
        explanation: 'Line 2: asyncScheduler.schedule enqueues a task into the Macrotask Queue (setTimeout).',
        consoleOutput: [createEntry('info', '1. Script Start (Sync)')]
      },
      {
        stepNumber: 3,
        phase: 'synchronous',
        phaseTitle: 'Synchronous Evaluation',
        action: 'enqueue',
        activeTaskId: 'task-asap',
        codeLineHighlight: 3,
        queues: {
          callStack: [{ id: 'main', name: 'main()', scheduler: 'sync', status: 'active' }],
          trampolineQueue: [],
          microtaskQueue: [
            { id: 'task-asap', name: 'asapScheduler Task', scheduler: 'asap', status: 'pending' }
          ],
          macrotaskQueue: [
            { id: 'task-async', name: 'asyncScheduler Task', scheduler: 'async', delayMs: 0, status: 'pending' }
          ],
          renderQueue: []
        },
        explanation: 'Line 3: asapScheduler.schedule enqueues a task into the Microtask Queue (queueMicrotask).',
        consoleOutput: [createEntry('info', '1. Script Start (Sync)')]
      },
      {
        stepNumber: 4,
        phase: 'synchronous',
        phaseTitle: 'Synchronous Trampoline',
        action: 'executing',
        activeTaskId: 'task-queue',
        codeLineHighlight: 4,
        queues: {
          callStack: [
            { id: 'main', name: 'main()', scheduler: 'sync', status: 'active' },
            { id: 'task-queue', name: 'queueScheduler Action', scheduler: 'queue', status: 'active' }
          ],
          trampolineQueue: [],
          microtaskQueue: [
            { id: 'task-asap', name: 'asapScheduler Task', scheduler: 'asap', status: 'pending' }
          ],
          macrotaskQueue: [
            { id: 'task-async', name: 'asyncScheduler Task', scheduler: 'async', delayMs: 0, status: 'pending' }
          ],
          renderQueue: []
        },
        explanation: 'Line 4: queueScheduler runs synchronously on the call stack via its trampoline!',
        consoleOutput: [createEntry('info', '1. Script Start (Sync)')]
      },
      {
        stepNumber: 5,
        phase: 'synchronous',
        phaseTitle: 'Synchronous Trampoline',
        action: 'output_logged',
        activeTaskId: 'task-queue',
        codeLineHighlight: 4,
        queues: {
          callStack: [
            { id: 'main', name: 'main()', scheduler: 'sync', status: 'active' },
            { id: 'task-queue', name: 'queueScheduler Action', scheduler: 'queue', status: 'completed' }
          ],
          trampolineQueue: [],
          microtaskQueue: [
            { id: 'task-asap', name: 'asapScheduler Task', scheduler: 'asap', status: 'pending' }
          ],
          macrotaskQueue: [
            { id: 'task-async', name: 'asyncScheduler Task', scheduler: 'async', delayMs: 0, status: 'pending' }
          ],
          renderQueue: []
        },
        explanation: 'queueScheduler executes immediately and logs output synchronously.',
        consoleOutput: [
          createEntry('info', '1. Script Start (Sync)'),
          createEntry('info', '2. queueScheduler (Sync Trampoline)')
        ]
      },
      {
        stepNumber: 6,
        phase: 'synchronous',
        phaseTitle: 'Synchronous Evaluation',
        action: 'enqueue',
        activeTaskId: 'task-raf',
        codeLineHighlight: 5,
        queues: {
          callStack: [{ id: 'main', name: 'main()', scheduler: 'sync', status: 'active' }],
          trampolineQueue: [],
          microtaskQueue: [
            { id: 'task-asap', name: 'asapScheduler Task', scheduler: 'asap', status: 'pending' }
          ],
          macrotaskQueue: [
            { id: 'task-async', name: 'asyncScheduler Task', scheduler: 'async', delayMs: 0, status: 'pending' }
          ],
          renderQueue: [
            { id: 'task-raf', name: 'animationFrame Task', scheduler: 'animation-frame', status: 'pending' }
          ]
        },
        explanation: 'Line 5: animationFrameScheduler enqueues work into the Render Queue (requestAnimationFrame).',
        consoleOutput: [
          createEntry('info', '1. Script Start (Sync)'),
          createEntry('info', '2. queueScheduler (Sync Trampoline)')
        ]
      },
      {
        stepNumber: 7,
        phase: 'synchronous',
        phaseTitle: 'Synchronous Evaluation',
        action: 'output_logged',
        activeTaskId: 'main',
        codeLineHighlight: 6,
        queues: {
          callStack: [{ id: 'main', name: 'main()', scheduler: 'sync', status: 'active' }],
          trampolineQueue: [],
          microtaskQueue: [
            { id: 'task-asap', name: 'asapScheduler Task', scheduler: 'asap', status: 'pending' }
          ],
          macrotaskQueue: [
            { id: 'task-async', name: 'asyncScheduler Task', scheduler: 'async', delayMs: 0, status: 'pending' }
          ],
          renderQueue: [
            { id: 'task-raf', name: 'animationFrame Task', scheduler: 'animation-frame', status: 'pending' }
          ]
        },
        explanation: 'Line 6: "2.5. Script End (Sync)" logs as the main script concludes.',
        consoleOutput: [
          createEntry('info', '1. Script Start (Sync)'),
          createEntry('info', '2. queueScheduler (Sync Trampoline)'),
          createEntry('info', '2.5. Script End (Sync)')
        ]
      },
      {
        stepNumber: 8,
        phase: 'synchronous',
        phaseTitle: 'Call Stack Empty',
        action: 'pop_stack',
        activeTaskId: null,
        codeLineHighlight: 6,
        queues: {
          callStack: [],
          trampolineQueue: [],
          microtaskQueue: [
            { id: 'task-asap', name: 'asapScheduler Task', scheduler: 'asap', status: 'pending' }
          ],
          macrotaskQueue: [
            { id: 'task-async', name: 'asyncScheduler Task', scheduler: 'async', delayMs: 0, status: 'pending' }
          ],
          renderQueue: [
            { id: 'task-raf', name: 'animationFrame Task', scheduler: 'animation-frame', status: 'pending' }
          ]
        },
        explanation: 'main() execution frame pops. The Call Stack is now EMPTY! Event loop proceeds to drain queues.',
        consoleOutput: [
          createEntry('info', '1. Script Start (Sync)'),
          createEntry('info', '2. queueScheduler (Sync Trampoline)'),
          createEntry('info', '2.5. Script End (Sync)')
        ]
      },
      {
        stepNumber: 9,
        phase: 'microtask',
        phaseTitle: 'Microtask Queue Drain',
        action: 'dequeue_to_stack',
        activeTaskId: 'task-asap',
        codeLineHighlight: 3,
        queues: {
          callStack: [
            { id: 'task-asap', name: 'asapAction()', scheduler: 'asap', status: 'active' }
          ],
          trampolineQueue: [],
          microtaskQueue: [],
          macrotaskQueue: [
            { id: 'task-async', name: 'asyncScheduler Task', scheduler: 'async', delayMs: 0, status: 'pending' }
          ],
          renderQueue: [
            { id: 'task-raf', name: 'animationFrame Task', scheduler: 'animation-frame', status: 'pending' }
          ]
        },
        explanation: 'RULE: Microtasks MUST drain completely before any macrotask or render cycle! asap task pushes to Call Stack.',
        consoleOutput: [
          createEntry('info', '1. Script Start (Sync)'),
          createEntry('info', '2. queueScheduler (Sync Trampoline)'),
          createEntry('info', '2.5. Script End (Sync)')
        ]
      },
      {
        stepNumber: 10,
        phase: 'microtask',
        phaseTitle: 'Microtask Execution',
        action: 'output_logged',
        activeTaskId: 'task-asap',
        codeLineHighlight: 3,
        queues: {
          callStack: [],
          trampolineQueue: [],
          microtaskQueue: [],
          macrotaskQueue: [
            { id: 'task-async', name: 'asyncScheduler Task', scheduler: 'async', delayMs: 0, status: 'pending' }
          ],
          renderQueue: [
            { id: 'task-raf', name: 'animationFrame Task', scheduler: 'animation-frame', status: 'pending' }
          ]
        },
        explanation: 'asapScheduler task executes: "3. asapScheduler (Microtask)" logged. Microtask queue is now empty.',
        consoleOutput: [
          createEntry('info', '1. Script Start (Sync)'),
          createEntry('info', '2. queueScheduler (Sync Trampoline)'),
          createEntry('info', '2.5. Script End (Sync)'),
          createEntry('info', '3. asapScheduler (Microtask)')
        ]
      },
      {
        stepNumber: 11,
        phase: 'render',
        phaseTitle: 'Render / Vsync Phase',
        action: 'dequeue_to_stack',
        activeTaskId: 'task-raf',
        codeLineHighlight: 5,
        queues: {
          callStack: [
            { id: 'task-raf', name: 'rAF Callback', scheduler: 'animation-frame', status: 'active' }
          ],
          trampolineQueue: [],
          microtaskQueue: [],
          macrotaskQueue: [
            { id: 'task-async', name: 'asyncScheduler Task', scheduler: 'async', delayMs: 0, status: 'pending' }
          ],
          renderQueue: []
        },
        explanation: 'Display vsync boundary reached: animationFrame callback dequeues and executes prior to screen repaint.',
        consoleOutput: [
          createEntry('info', '1. Script Start (Sync)'),
          createEntry('info', '2. queueScheduler (Sync Trampoline)'),
          createEntry('info', '2.5. Script End (Sync)'),
          createEntry('info', '3. asapScheduler (Microtask)')
        ]
      },
      {
        stepNumber: 12,
        phase: 'render',
        phaseTitle: 'Render Phase Complete',
        action: 'output_logged',
        activeTaskId: 'task-raf',
        codeLineHighlight: 5,
        queues: {
          callStack: [],
          trampolineQueue: [],
          microtaskQueue: [],
          macrotaskQueue: [
            { id: 'task-async', name: 'asyncScheduler Task', scheduler: 'async', delayMs: 0, status: 'pending' }
          ],
          renderQueue: []
        },
        explanation: 'animationFrame task completes and screen paints. Call stack empties.',
        consoleOutput: [
          createEntry('info', '1. Script Start (Sync)'),
          createEntry('info', '2. queueScheduler (Sync Trampoline)'),
          createEntry('info', '2.5. Script End (Sync)'),
          createEntry('info', '3. asapScheduler (Microtask)'),
          createEntry('info', '4. animationFrame (Render)')
        ]
      },
      {
        stepNumber: 13,
        phase: 'macrotask',
        phaseTitle: 'Macrotask Execution',
        action: 'dequeue_to_stack',
        activeTaskId: 'task-async',
        codeLineHighlight: 2,
        queues: {
          callStack: [
            { id: 'task-async', name: 'asyncAction()', scheduler: 'async', status: 'active' }
          ],
          trampolineQueue: [],
          microtaskQueue: [],
          macrotaskQueue: [],
          renderQueue: []
        },
        explanation: 'Microtasks and render completed. Event loop picks the oldest task from Macrotask Queue: asyncScheduler!',
        consoleOutput: [
          createEntry('info', '1. Script Start (Sync)'),
          createEntry('info', '2. queueScheduler (Sync Trampoline)'),
          createEntry('info', '2.5. Script End (Sync)'),
          createEntry('info', '3. asapScheduler (Microtask)'),
          createEntry('info', '4. animationFrame (Render)')
        ]
      },
      {
        stepNumber: 14,
        phase: 'macrotask',
        phaseTitle: 'Macrotask Output',
        action: 'output_logged',
        activeTaskId: 'task-async',
        codeLineHighlight: 2,
        queues: {
          callStack: [],
          trampolineQueue: [],
          microtaskQueue: [],
          macrotaskQueue: [],
          renderQueue: []
        },
        explanation: 'asyncScheduler task logs "5. asyncScheduler (Macrotask)". All queues are now empty.',
        consoleOutput: [
          createEntry('info', '1. Script Start (Sync)'),
          createEntry('info', '2. queueScheduler (Sync Trampoline)'),
          createEntry('info', '2.5. Script End (Sync)'),
          createEntry('info', '3. asapScheduler (Microtask)'),
          createEntry('info', '4. animationFrame (Render)'),
          createEntry('info', '5. asyncScheduler (Macrotask)')
        ]
      },
      {
        stepNumber: 15,
        phase: 'completed',
        phaseTitle: 'Simulation Completed',
        action: 'executing',
        activeTaskId: null,
        codeLineHighlight: 6,
        queues: {
          callStack: [],
          trampolineQueue: [],
          microtaskQueue: [],
          macrotaskQueue: [],
          renderQueue: []
        },
        explanation: 'Execution sequence confirmed: 1 (Sync) -> 2 (Queue) -> 2.5 (Sync End) -> 3 (Microtask) -> 4 (Render) -> 5 (Macrotask)!',
        consoleOutput: [
          createEntry('info', '1. Script Start (Sync)'),
          createEntry('info', '2. queueScheduler (Sync Trampoline)'),
          createEntry('info', '2.5. Script End (Sync)'),
          createEntry('info', '3. asapScheduler (Microtask)'),
          createEntry('info', '4. animationFrame (Render)'),
          createEntry('info', '5. asyncScheduler (Macrotask)'),
          createEntry('complete', '✔ Event Loop Turn Finished cleanly')
        ]
      }
    ]
  },

  // Scenario 2: Trampoline Recursion
  {
    id: 'trampoline-recursion',
    name: 'Trampoline Recursion',
    badge: 'queueScheduler Stack Safety',
    description: 'Demonstrates how queueScheduler prevents call stack overflow by unwinding recursive scheduling into a flat while-loop at stack depth 1.',
    codeSnippet: `console.log('--- Start Trampoline ---');
queueScheduler.schedule(function (state) {
  console.log(\`Level \${state} on stack depth 1\`);
  if (state < 4) {
    this.schedule(state + 1); // Queued on trampoline!
  }
}, 0, 1);
console.log('--- End Trampoline ---');`,
    steps: [
      {
        stepNumber: 0,
        phase: 'synchronous',
        phaseTitle: 'Main Script Evaluation',
        action: 'executing',
        activeTaskId: 'main',
        codeLineHighlight: 1,
        queues: {
          callStack: [{ id: 'main', name: 'main()', scheduler: 'sync', status: 'active' }],
          trampolineQueue: [],
          microtaskQueue: [],
          macrotaskQueue: [],
          renderQueue: []
        },
        explanation: 'Evaluating main() script frame.',
        consoleOutput: [createEntry('info', '--- Start Trampoline ---')]
      },
      {
        stepNumber: 1,
        phase: 'synchronous',
        phaseTitle: 'Trampoline Iteration 1',
        action: 'dequeue_to_stack',
        activeTaskId: 'rec-1',
        codeLineHighlight: 3,
        queues: {
          callStack: [
            { id: 'main', name: 'main()', scheduler: 'sync', status: 'active' },
            { id: 'rec-1', name: 'action(state=1)', scheduler: 'queue', recursionDepth: 1, status: 'active' }
          ],
          trampolineQueue: [],
          microtaskQueue: [],
          macrotaskQueue: [],
          renderQueue: []
        },
        explanation: 'queueScheduler begins trampoline: state=1 pushes onto Call Stack (stack depth 1).',
        consoleOutput: [
          createEntry('info', '--- Start Trampoline ---'),
          createEntry('info', 'Level 1 on stack depth 1')
        ]
      },
      {
        stepNumber: 2,
        phase: 'synchronous',
        phaseTitle: 'Enqueue Next Recursion',
        action: 'enqueue',
        activeTaskId: 'rec-2',
        codeLineHighlight: 5,
        queues: {
          callStack: [
            { id: 'main', name: 'main()', scheduler: 'sync', status: 'active' },
            { id: 'rec-1', name: 'action(state=1)', scheduler: 'queue', recursionDepth: 1, status: 'active' }
          ],
          trampolineQueue: [
            { id: 'rec-2', name: 'action(state=2)', scheduler: 'queue', recursionDepth: 2, status: 'pending' }
          ],
          microtaskQueue: [],
          macrotaskQueue: [],
          renderQueue: []
        },
        explanation: 'this.schedule(2) is called inside action(1). Because trampoline is busy, state=2 is queued on the Trampoline Queue!',
        consoleOutput: [
          createEntry('info', '--- Start Trampoline ---'),
          createEntry('info', 'Level 1 on stack depth 1')
        ]
      },
      {
        stepNumber: 3,
        phase: 'synchronous',
        phaseTitle: 'Unwind & Trampoline Iteration 2',
        action: 'dequeue_to_stack',
        activeTaskId: 'rec-2',
        codeLineHighlight: 3,
        queues: {
          callStack: [
            { id: 'main', name: 'main()', scheduler: 'sync', status: 'active' },
            { id: 'rec-2', name: 'action(state=2)', scheduler: 'queue', recursionDepth: 1, status: 'active' }
          ],
          trampolineQueue: [],
          microtaskQueue: [],
          macrotaskQueue: [],
          renderQueue: []
        },
        explanation: 'action(1) finishes and pops! Trampoline while-loop immediately picks state=2. Stack depth remains at 1!',
        consoleOutput: [
          createEntry('info', '--- Start Trampoline ---'),
          createEntry('info', 'Level 1 on stack depth 1'),
          createEntry('info', 'Level 2 on stack depth 1')
        ]
      },
      {
        stepNumber: 4,
        phase: 'synchronous',
        phaseTitle: 'Enqueue Next Recursion',
        action: 'enqueue',
        activeTaskId: 'rec-3',
        codeLineHighlight: 5,
        queues: {
          callStack: [
            { id: 'main', name: 'main()', scheduler: 'sync', status: 'active' },
            { id: 'rec-2', name: 'action(state=2)', scheduler: 'queue', recursionDepth: 1, status: 'active' }
          ],
          trampolineQueue: [
            { id: 'rec-3', name: 'action(state=3)', scheduler: 'queue', recursionDepth: 3, status: 'pending' }
          ],
          microtaskQueue: [],
          macrotaskQueue: [],
          renderQueue: []
        },
        explanation: 'action(2) schedules state=3 onto Trampoline Queue.',
        consoleOutput: [
          createEntry('info', '--- Start Trampoline ---'),
          createEntry('info', 'Level 1 on stack depth 1'),
          createEntry('info', 'Level 2 on stack depth 1')
        ]
      },
      {
        stepNumber: 5,
        phase: 'synchronous',
        phaseTitle: 'Trampoline Iteration 3',
        action: 'dequeue_to_stack',
        activeTaskId: 'rec-3',
        codeLineHighlight: 3,
        queues: {
          callStack: [
            { id: 'main', name: 'main()', scheduler: 'sync', status: 'active' },
            { id: 'rec-3', name: 'action(state=3)', scheduler: 'queue', recursionDepth: 1, status: 'active' }
          ],
          trampolineQueue: [],
          microtaskQueue: [],
          macrotaskQueue: [],
          renderQueue: []
        },
        explanation: 'action(2) pops. Trampoline dequeues state=3 at depth 1. Logs Level 3.',
        consoleOutput: [
          createEntry('info', '--- Start Trampoline ---'),
          createEntry('info', 'Level 1 on stack depth 1'),
          createEntry('info', 'Level 2 on stack depth 1'),
          createEntry('info', 'Level 3 on stack depth 1')
        ]
      },
      {
        stepNumber: 6,
        phase: 'synchronous',
        phaseTitle: 'Final Recursion Step',
        action: 'dequeue_to_stack',
        activeTaskId: 'rec-4',
        codeLineHighlight: 3,
        queues: {
          callStack: [
            { id: 'main', name: 'main()', scheduler: 'sync', status: 'active' },
            { id: 'rec-4', name: 'action(state=4)', scheduler: 'queue', recursionDepth: 1, status: 'active' }
          ],
          trampolineQueue: [],
          microtaskQueue: [],
          macrotaskQueue: [],
          renderQueue: []
        },
        explanation: 'action(3) schedules state=4 and pops. action(4) runs at depth 1. Recursion condition state < 4 is false.',
        consoleOutput: [
          createEntry('info', '--- Start Trampoline ---'),
          createEntry('info', 'Level 1 on stack depth 1'),
          createEntry('info', 'Level 2 on stack depth 1'),
          createEntry('info', 'Level 3 on stack depth 1'),
          createEntry('info', 'Level 4 on stack depth 1')
        ]
      },
      {
        stepNumber: 7,
        phase: 'synchronous',
        phaseTitle: 'Trampoline Complete',
        action: 'output_logged',
        activeTaskId: 'main',
        codeLineHighlight: 7,
        queues: {
          callStack: [{ id: 'main', name: 'main()', scheduler: 'sync', status: 'active' }],
          trampolineQueue: [],
          microtaskQueue: [],
          macrotaskQueue: [],
          renderQueue: []
        },
        explanation: 'Trampoline finishes with zero stack growth! main() completes with "--- End Trampoline ---".',
        consoleOutput: [
          createEntry('info', '--- Start Trampoline ---'),
          createEntry('info', 'Level 1 on stack depth 1'),
          createEntry('info', 'Level 2 on stack depth 1'),
          createEntry('info', 'Level 3 on stack depth 1'),
          createEntry('info', 'Level 4 on stack depth 1'),
          createEntry('info', '--- End Trampoline ---'),
          createEntry('complete', '✔ Trampoline successfully executed without stack overflow')
        ]
      }
    ]
  },

  // Scenario 3: Delay & Cancellation Race
  {
    id: 'delay-cancellation',
    name: 'Delay & Cancellation Race',
    badge: 'asyncScheduler Unsubscribe',
    description: 'Demonstrates scheduling macrotask actions with delays and cleanly cancelling an action via action.unsubscribe() before its delay expires.',
    codeSnippet: `console.log('Scheduling delayed actions...');
const action1 = asyncScheduler.schedule(() => console.log('Action 1 ran'), 200);
const action2 = asyncScheduler.schedule(() => console.log('Action 2 ran'), 500);

// Abort action 1 before delay elapses
action1.unsubscribe();
console.log('Action 1 cancelled!');`,
    steps: [
      {
        stepNumber: 0,
        phase: 'synchronous',
        phaseTitle: 'Scheduling Action 1',
        action: 'enqueue',
        activeTaskId: 'act-1',
        codeLineHighlight: 2,
        queues: {
          callStack: [{ id: 'main', name: 'main()', scheduler: 'sync', status: 'active' }],
          trampolineQueue: [],
          microtaskQueue: [],
          macrotaskQueue: [
            { id: 'act-1', name: 'Action 1 (200ms)', scheduler: 'async', delayMs: 200, status: 'pending' }
          ],
          renderQueue: []
        },
        explanation: 'asyncScheduler.schedule registers Action 1 in the Macrotask Queue with a 200ms delay timer.',
        consoleOutput: [createEntry('info', 'Scheduling delayed actions...')]
      },
      {
        stepNumber: 1,
        phase: 'synchronous',
        phaseTitle: 'Scheduling Action 2',
        action: 'enqueue',
        activeTaskId: 'act-2',
        codeLineHighlight: 3,
        queues: {
          callStack: [{ id: 'main', name: 'main()', scheduler: 'sync', status: 'active' }],
          trampolineQueue: [],
          microtaskQueue: [],
          macrotaskQueue: [
            { id: 'act-1', name: 'Action 1 (200ms)', scheduler: 'async', delayMs: 200, status: 'pending' },
            { id: 'act-2', name: 'Action 2 (500ms)', scheduler: 'async', delayMs: 500, status: 'pending' }
          ],
          renderQueue: []
        },
        explanation: 'asyncScheduler registers Action 2 with a 500ms delay timer.',
        consoleOutput: [createEntry('info', 'Scheduling delayed actions...')]
      },
      {
        stepNumber: 2,
        phase: 'synchronous',
        phaseTitle: 'Cancelling Action 1',
        action: 'cancelled',
        activeTaskId: 'act-1',
        codeLineHighlight: 6,
        queues: {
          callStack: [{ id: 'main', name: 'main()', scheduler: 'sync', status: 'active' }],
          trampolineQueue: [],
          microtaskQueue: [],
          macrotaskQueue: [
            { id: 'act-2', name: 'Action 2 (500ms)', scheduler: 'async', delayMs: 500, status: 'pending' }
          ],
          renderQueue: []
        },
        explanation: 'action1.unsubscribe() is invoked! The underlying browser timer is cancelled and Action 1 is purged.',
        consoleOutput: [
          createEntry('info', 'Scheduling delayed actions...'),
          createEntry('info', 'Action 1 cancelled!')
        ]
      },
      {
        stepNumber: 3,
        phase: 'macrotask',
        phaseTitle: '200ms Elapses (No Action)',
        action: 'executing',
        activeTaskId: null,
        codeLineHighlight: 6,
        queues: {
          callStack: [],
          trampolineQueue: [],
          microtaskQueue: [],
          macrotaskQueue: [
            { id: 'act-2', name: 'Action 2 (500ms)', scheduler: 'async', delayMs: 300, status: 'pending' }
          ],
          renderQueue: []
        },
        explanation: 'At 200ms: Action 1 was cancelled, so nothing fires! Action 2 is still waiting.',
        consoleOutput: [
          createEntry('info', 'Scheduling delayed actions...'),
          createEntry('info', 'Action 1 cancelled!')
        ]
      },
      {
        stepNumber: 4,
        phase: 'macrotask',
        phaseTitle: '500ms Elapses: Action 2 Fires',
        action: 'dequeue_to_stack',
        activeTaskId: 'act-2',
        codeLineHighlight: 3,
        queues: {
          callStack: [
            { id: 'act-2', name: 'Action 2 Handler', scheduler: 'async', status: 'active' }
          ],
          trampolineQueue: [],
          microtaskQueue: [],
          macrotaskQueue: [],
          renderQueue: []
        },
        explanation: '500ms timer elapses! Action 2 moves from Macrotask Queue onto Call Stack.',
        consoleOutput: [
          createEntry('info', 'Scheduling delayed actions...'),
          createEntry('info', 'Action 1 cancelled!')
        ]
      },
      {
        stepNumber: 5,
        phase: 'completed',
        phaseTitle: 'Action 2 Output Logged',
        action: 'output_logged',
        activeTaskId: 'act-2',
        codeLineHighlight: 3,
        queues: {
          callStack: [],
          trampolineQueue: [],
          microtaskQueue: [],
          macrotaskQueue: [],
          renderQueue: []
        },
        explanation: 'Action 2 completes and logs "Action 2 ran". Action 1 never executed!',
        consoleOutput: [
          createEntry('info', 'Scheduling delayed actions...'),
          createEntry('info', 'Action 1 cancelled!'),
          createEntry('info', 'Action 2 ran'),
          createEntry('complete', '✔ Cancellation successfully verified')
        ]
      }
    ]
  },

  // Scenario 4: Microtask FIFO Ordering
  {
    id: 'microtask-fifo',
    name: 'Microtask Queue Drain (FIFO Order)',
    badge: 'asapScheduler FIFO',
    description: 'Verifies that multiple asapScheduler microtasks execute in strict First-In, First-Out order before any macrotask.',
    codeSnippet: `asyncScheduler.schedule(() => console.log('Macrotask: asyncScheduler'));
asapScheduler.schedule(() => console.log('Microtask 1: asapScheduler'));
asapScheduler.schedule(() => console.log('Microtask 2: asapScheduler'));
asapScheduler.schedule(() => console.log('Microtask 3: asapScheduler'));
console.log('Synchronous script completed');`,
    steps: [
      {
        stepNumber: 0,
        phase: 'synchronous',
        phaseTitle: 'Queue All Tasks',
        action: 'enqueue',
        activeTaskId: null,
        codeLineHighlight: 1,
        queues: {
          callStack: [{ id: 'main', name: 'main()', scheduler: 'sync', status: 'active' }],
          trampolineQueue: [],
          microtaskQueue: [
            { id: 'm1', name: 'Microtask 1', scheduler: 'asap', status: 'pending' },
            { id: 'm2', name: 'Microtask 2', scheduler: 'asap', status: 'pending' },
            { id: 'm3', name: 'Microtask 3', scheduler: 'asap', status: 'pending' }
          ],
          macrotaskQueue: [
            { id: 'macro', name: 'Macrotask (async)', scheduler: 'async', delayMs: 0, status: 'pending' }
          ],
          renderQueue: []
        },
        explanation: 'All 3 microtasks and 1 macrotask are registered during synchronous script evaluation.',
        consoleOutput: [createEntry('info', 'Synchronous script completed')]
      },
      {
        stepNumber: 1,
        phase: 'microtask',
        phaseTitle: 'Drain Microtask 1',
        action: 'output_logged',
        activeTaskId: 'm1',
        codeLineHighlight: 2,
        queues: {
          callStack: [],
          trampolineQueue: [],
          microtaskQueue: [
            { id: 'm2', name: 'Microtask 2', scheduler: 'asap', status: 'pending' },
            { id: 'm3', name: 'Microtask 3', scheduler: 'asap', status: 'pending' }
          ],
          macrotaskQueue: [
            { id: 'macro', name: 'Macrotask (async)', scheduler: 'async', delayMs: 0, status: 'pending' }
          ],
          renderQueue: []
        },
        explanation: 'First in queue: Microtask 1 executes and logs output.',
        consoleOutput: [
          createEntry('info', 'Synchronous script completed'),
          createEntry('info', 'Microtask 1: asapScheduler')
        ]
      },
      {
        stepNumber: 2,
        phase: 'microtask',
        phaseTitle: 'Drain Microtask 2',
        action: 'output_logged',
        activeTaskId: 'm2',
        codeLineHighlight: 3,
        queues: {
          callStack: [],
          trampolineQueue: [],
          microtaskQueue: [
            { id: 'm3', name: 'Microtask 3', scheduler: 'asap', status: 'pending' }
          ],
          macrotaskQueue: [
            { id: 'macro', name: 'Macrotask (async)', scheduler: 'async', delayMs: 0, status: 'pending' }
          ],
          renderQueue: []
        },
        explanation: 'Second in queue: Microtask 2 executes and logs output.',
        consoleOutput: [
          createEntry('info', 'Synchronous script completed'),
          createEntry('info', 'Microtask 1: asapScheduler'),
          createEntry('info', 'Microtask 2: asapScheduler')
        ]
      },
      {
        stepNumber: 3,
        phase: 'microtask',
        phaseTitle: 'Drain Microtask 3',
        action: 'output_logged',
        activeTaskId: 'm3',
        codeLineHighlight: 4,
        queues: {
          callStack: [],
          trampolineQueue: [],
          microtaskQueue: [],
          macrotaskQueue: [
            { id: 'macro', name: 'Macrotask (async)', scheduler: 'async', delayMs: 0, status: 'pending' }
          ],
          renderQueue: []
        },
        explanation: 'Third in queue: Microtask 3 executes. Microtask queue is now completely drained!',
        consoleOutput: [
          createEntry('info', 'Synchronous script completed'),
          createEntry('info', 'Microtask 1: asapScheduler'),
          createEntry('info', 'Microtask 2: asapScheduler'),
          createEntry('info', 'Microtask 3: asapScheduler')
        ]
      },
      {
        stepNumber: 4,
        phase: 'macrotask',
        phaseTitle: 'Macrotask Finally Dispatched',
        action: 'output_logged',
        activeTaskId: 'macro',
        codeLineHighlight: 1,
        queues: {
          callStack: [],
          trampolineQueue: [],
          microtaskQueue: [],
          macrotaskQueue: [],
          renderQueue: []
        },
        explanation: 'Only after ALL microtasks drained does the event loop execute the macrotask!',
        consoleOutput: [
          createEntry('info', 'Synchronous script completed'),
          createEntry('info', 'Microtask 1: asapScheduler'),
          createEntry('info', 'Microtask 2: asapScheduler'),
          createEntry('info', 'Microtask 3: asapScheduler'),
          createEntry('info', 'Macrotask: asyncScheduler'),
          createEntry('complete', '✔ FIFO order strictly preserved')
        ]
      }
    ]
  },

  // Scenario 5: Animation Frame 60fps Sync
  {
    id: 'animation-frame-sync',
    name: 'Animation Frame 60fps Vsync',
    badge: 'animationFrameScheduler',
    description: 'Demonstrates synchronization with browser hardware refresh rate (requestAnimationFrame) before paint cycles.',
    codeSnippet: `console.log('Initiating smooth frame update...');
asyncScheduler.schedule(() => console.log('Macrotask Timer (setTimeout)'));
animationFrameScheduler.schedule(() => {
  console.log('Frame 1: 60fps render cycle');
  animationFrameScheduler.schedule(() => console.log('Frame 2: Next vsync paint'));
});
console.log('Scheduling complete');`,
    steps: [
      {
        stepNumber: 0,
        phase: 'synchronous',
        phaseTitle: 'Register Frame Callback',
        action: 'enqueue',
        activeTaskId: null,
        codeLineHighlight: 1,
        queues: {
          callStack: [{ id: 'main', name: 'main()', scheduler: 'sync', status: 'active' }],
          trampolineQueue: [],
          microtaskQueue: [],
          macrotaskQueue: [
            { id: 'macro', name: 'Macrotask', scheduler: 'async', delayMs: 0, status: 'pending' }
          ],
          renderQueue: [
            { id: 'f1', name: 'Frame 1 (rAF)', scheduler: 'animation-frame', status: 'pending' }
          ]
        },
        explanation: 'Frame 1 callback is registered with the browser render pipeline.',
        consoleOutput: [
          createEntry('info', 'Initiating smooth frame update...'),
          createEntry('info', 'Scheduling complete')
        ]
      },
      {
        stepNumber: 1,
        phase: 'render',
        phaseTitle: 'Vsync Paint Frame 1',
        action: 'dequeue_to_stack',
        activeTaskId: 'f1',
        codeLineHighlight: 3,
        queues: {
          callStack: [
            { id: 'f1', name: 'Frame 1 Handler', scheduler: 'animation-frame', status: 'active' }
          ],
          trampolineQueue: [],
          microtaskQueue: [],
          macrotaskQueue: [
            { id: 'macro', name: 'Macrotask', scheduler: 'async', delayMs: 0, status: 'pending' }
          ],
          renderQueue: [
            { id: 'f2', name: 'Frame 2 (Next Vsync)', scheduler: 'animation-frame', status: 'pending' }
          ]
        },
        explanation: 'Before paint: Frame 1 runs and schedules Frame 2 for the next display refresh.',
        consoleOutput: [
          createEntry('info', 'Initiating smooth frame update...'),
          createEntry('info', 'Scheduling complete'),
          createEntry('info', 'Frame 1: 60fps render cycle')
        ]
      },
      {
        stepNumber: 2,
        phase: 'macrotask',
        phaseTitle: 'Macrotask Runs Between Frames',
        action: 'output_logged',
        activeTaskId: 'macro',
        codeLineHighlight: 2,
        queues: {
          callStack: [],
          trampolineQueue: [],
          microtaskQueue: [],
          macrotaskQueue: [],
          renderQueue: [
            { id: 'f2', name: 'Frame 2 (Next Vsync)', scheduler: 'animation-frame', status: 'pending' }
          ]
        },
        explanation: 'Macrotask runs in the gap between the first and second render cycles.',
        consoleOutput: [
          createEntry('info', 'Initiating smooth frame update...'),
          createEntry('info', 'Scheduling complete'),
          createEntry('info', 'Frame 1: 60fps render cycle'),
          createEntry('info', 'Macrotask Timer (setTimeout)')
        ]
      },
      {
        stepNumber: 3,
        phase: 'render',
        phaseTitle: 'Next Vsync Paint Frame 2',
        action: 'output_logged',
        activeTaskId: 'f2',
        codeLineHighlight: 5,
        queues: {
          callStack: [],
          trampolineQueue: [],
          microtaskQueue: [],
          macrotaskQueue: [],
          renderQueue: []
        },
        explanation: 'Next vsync tick arrives (~16.6ms later): Frame 2 executes smoothly.',
        consoleOutput: [
          createEntry('info', 'Initiating smooth frame update...'),
          createEntry('info', 'Scheduling complete'),
          createEntry('info', 'Frame 1: 60fps render cycle'),
          createEntry('info', 'Macrotask Timer (setTimeout)'),
          createEntry('info', 'Frame 2: Next vsync paint'),
          createEntry('complete', '✔ 60fps Vsync synchronization verified')
        ]
      }
    ]
  }
];
