import { ComparisonData, QuizQuestion } from '../../core/models';

export interface FundamentalTopicData {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  concept: {
    summary: string;
    pillarsTitle?: string;
    pillars?: { title: string; description: string }[];
    sections: { title: string; content: string }[];
    takeaways: string[];
  };
  code: {
    title: string;
    code: string;
    language: string;
    highlightLines?: number[];
  };
  comparison: ComparisonData;
  quiz: QuizQuestion[];
  demo: {
    type: 'what-is-rxjs' | 'what-is-observable' | 'observable-vs-promise' | 'observer-subscriber' | 'subscription-lifecycle' | 'cold-vs-hot' | 'multicasting';
    title: string;
    description: string;
  };
}

export const MODULE1_TOPICS: Record<string, FundamentalTopicData> = {
  'what-is-rxjs': {
    id: 'what-is-rxjs',
    title: 'What is RxJS?',
    subtitle: 'Reactive Extensions for JavaScript: Asynchronous event streams made composable and declarative',
    category: 'Fundamentals',
    difficulty: 'beginner',
    concept: {
      summary:
        'RxJS (Reactive Extensions for JavaScript) is a reactive programming library for composing asynchronous and event-based programs using observable sequences. It treats streams of asynchronous events with the same composability, elegance, and declarative power that JavaScript array methods apply to in-memory collections.',
      pillarsTitle: 'The Three Foundational Pillars of RxJS',
      pillars: [
        {
          title: 'Observer Pattern',
          description:
            'Decouples data producers from consumers. Multiple consumers subscribe to an event stream and react to notifications (next, error, complete) without tight coupling to the data producer.'
        },
        {
          title: 'Iterator Pattern',
          description:
            'Enables progressive traversal over sequences over time. Inverts the model from synchronous pull (where consumer calls .next()) to reactive push (where producer calls next(value)).'
        },
        {
          title: 'Functional Programming',
          description:
            'Composes pure, deterministic pipeable operators (map, filter, scan, switchMap). Operators return new Observable sequences without mutating source streams or sharing state.'
        }
      ],
      sections: [
        {
          title: 'The Push vs. Pull Paradigm',
          content:
            'In a Pull system (functions, ES6 generators), the Consumer determines when to receive data; the Producer is passive until queried. In a Push system (DOM events, Promises, RxJS Observables), the Producer determines when data is sent; the Consumer registers an Observer and is notified reactively.'
        },
        {
          title: 'Why RxJS is Critical in Modern Web & Angular',
          content:
            'Frontend applications handle complex async scenarios: debouncing keystrokes in search autocomplete, coordinating race conditions between concurrent HTTP requests, managing WebSocket streams, exponential backoff retries, and preventing memory leaks on component destruction.'
        }
      ],
      takeaways: [
        'RxJS treats events as collections distributed over time.',
        'Observables are push-based: producers emit values to subscribed observers.',
        'Operators are pure functions that transform streams immutably.',
        'Declarative composition replaces messy nested callbacks and imperative flag variables.'
      ]
    },
    code: {
      title: 'Real-World RxJS Autocomplete Pipeline',
      language: 'typescript',
      highlightLines: [6, 8, 10, 12],
      code: `import { fromEvent, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, filter, switchMap } from 'rxjs/operators';

// 1. Create stream from DOM keyboard input
const searchInput = document.getElementById('search-input') as HTMLInputElement;

const searchStream$ = fromEvent<InputEvent>(searchInput, 'input').pipe(
  // Extract user text
  map(event => (event.target as HTMLInputElement).value),
  // Filter out short queries
  filter(query => query.trim().length >= 3),
  // Debounce typing pause: wait 300ms of user silence
  debounceTime(300),
  // Prevent duplicate HTTP requests if query did not change
  distinctUntilChanged()
);

// 2. Subscribe to consume stream notifications
const subscription = searchStream$.subscribe({
  next: searchTerm => console.log('Dispatching HTTP search query for:', searchTerm),
  error: err => console.error('Stream failure:', err),
  complete: () => console.log('Search stream completed')
});`
    },
    comparison: {
      features: [
        { id: 'paradigm', label: 'Communication Protocol', description: 'Who initiates data transfer' },
        { id: 'producer', label: 'Producer Status', description: 'When is data generated' },
        { id: 'consumer', label: 'Consumer Status', description: 'How consumer gets data' },
        { id: 'values', label: 'Value Cardinality', description: 'Number of values produced' },
        { id: 'evaluation', label: 'Evaluation Timing', description: 'Lazy vs eager execution' },
        { id: 'operators', label: 'Operator Library', description: 'Built-in transformation tools' }
      ],
      items: [
        {
          id: 'function',
          name: 'Function',
          recommendedUse: 'Single synchronous computation on demand',
          characteristics: {
            paradigm: { text: 'Pull (Synchronous)', status: 'neutral' },
            producer: { text: 'Passive (computes when called)', status: 'neutral' },
            consumer: { text: 'Active (decides when called)', status: 'positive' },
            values: { text: 'Exactly 1 value', status: 'neutral' },
            evaluation: { text: 'Eager on call', status: 'neutral' },
            operators: { text: 'None (manual logic)', status: 'negative' }
          }
        },
        {
          id: 'generator',
          name: 'Generator',
          recommendedUse: 'Lazy paused sequences and custom iterators',
          characteristics: {
            paradigm: { text: 'Pull (Step-by-step)', status: 'neutral' },
            producer: { text: 'Passive until .next() queried', status: 'neutral' },
            consumer: { text: 'Active (pulls when ready)', status: 'positive' },
            values: { text: '0 to Infinite values', status: 'positive' },
            evaluation: { text: 'Lazy on pull', status: 'positive' },
            operators: { text: 'Standard Iterators', status: 'neutral' }
          }
        },
        {
          id: 'promise',
          name: 'Promise',
          recommendedUse: 'One-shot asynchronous network or file operations',
          characteristics: {
            paradigm: { text: 'Push (Asynchronous)', status: 'neutral' },
            producer: { text: 'Active immediately (eager)', status: 'neutral' },
            consumer: { text: 'Passive receiver (.then)', status: 'neutral' },
            values: { text: 'Exactly 1 value', status: 'neutral' },
            evaluation: { text: 'Eager on declaration', status: 'neutral' },
            operators: { text: 'Limited (.then, .catch, .finally)', status: 'negative' }
          }
        },
        {
          id: 'observable',
          name: 'RxJS Observable',
          badge: 'Reactive Standard',
          recommendedUse: 'Complex asynchronous event streams, real-time UI, cancellation',
          characteristics: {
            paradigm: { text: 'Push (Sync or Async)', status: 'positive' },
            producer: { text: 'Passive until subscribed (lazy)', status: 'positive' },
            consumer: { text: 'Passive listener (Observer)', status: 'positive' },
            values: { text: '0 to Infinite values', status: 'positive' },
            evaluation: { text: 'Lazy on subscription', status: 'positive' },
            operators: { text: '100+ Functional Operators', status: 'positive' }
          }
        }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What is the key difference between a Pull and a Push data architecture?',
        options: [
          { id: 'a', text: 'Pull systems are always faster than Push systems' },
          { id: 'b', text: 'In Pull, the consumer decides when to receive data; in Push, the producer decides when to send data' },
          { id: 'c', text: 'In Push, the consumer must query every millisecond' },
          { id: 'd', text: 'Promises are Pull while Observables are Push' }
        ],
        correctOptionId: 'b',
        explanation:
          'In pull systems (like functions and iterators), the consumer actively requests data when ready. In push systems (like RxJS Observables and DOM events), the producer emits data to subscribed consumers asynchronously.'
      },
      {
        id: 'q2',
        question: 'Which three foundational design patterns are combined in RxJS?',
        options: [
          { id: 'a', text: 'Observer Pattern, Iterator Pattern, and Functional Programming' },
          { id: 'b', text: 'Singleton, Factory, and Decorator Patterns' },
          { id: 'c', text: 'Model-View-Controller, State Machine, and Proxy' },
          { id: 'd', text: 'Redux, Microservices, and Event Sourcing' }
        ],
        correctOptionId: 'a',
        explanation:
          'RxJS blends the Observer pattern (for reactive notifications), the Iterator pattern (for sequential data traversal), and Functional Programming (for immutable, pipeable operator composition).'
      },
      {
        id: 'q3',
        question: 'What happens when an Observable is defined without any subscribe() calls?',
        options: [
          { id: 'a', text: 'It starts executing immediately in the background' },
          { id: 'b', text: 'Nothing executes because Observables are lazy blueprints' },
          { id: 'c', text: 'It throws an UnsubscribedStreamError' },
          { id: 'd', text: 'It buffers values indefinitely until memory is exhausted' }
        ],
        correctOptionId: 'b',
        explanation:
          'Observables are lazy collections. Declaring an Observable merely creates an execution blueprint; no values are emitted until an observer subscribes.'
      },
      {
        id: 'q4',
        question: 'How do RxJS pipeable operators handle state mutations?',
        options: [
          { id: 'a', text: 'They mutate the input Observable directly in place' },
          { id: 'b', text: 'They are pure functions that return a new Observable without modifying the original stream' },
          { id: 'c', text: 'They store global state inside window.RxJS' },
          { id: 'd', text: 'They require manual deep copying of the stream' }
        ],
        correctOptionId: 'b',
        explanation:
          'RxJS operators are pure functional constructs. Calling .pipe() returns a new Observable sequence, leaving the source stream untouched.'
      }
    ],
    demo: {
      type: 'what-is-rxjs',
      title: 'Push vs. Pull Reactive Studio',
      description: 'Interact with both Pull and Push models to see who controls data flow and how logs arrive in real time.'
    }
  },

  'what-is-observable': {
    id: 'what-is-observable',
    title: 'What is an Observable?',
    subtitle: 'The fundamental push blueprint: lazy evaluation, synchronous execution by default, and notification contracts',
    category: 'Fundamentals',
    difficulty: 'beginner',
    concept: {
      summary:
        'An Observable is a lazily evaluated push collection that can deliver zero, one, or multiple values over time, either synchronously or asynchronously. Calling new Observable(subscriber => ...) does not start execution — it only creates a reusable blueprint.',
      pillarsTitle: 'The Anatomy of an Observable Execution',
      pillars: [
        {
          title: 'Blueprint Metaphor',
          description:
            'An Observable is not a background worker or ongoing stream. It is a function recipe. Subscribing to an Observable is equivalent to invoking a function and passing callbacks.'
        },
        {
          title: 'Notification Contract',
          description:
            '0 to N next(value) emissions, followed by at most ONE terminal notification: either complete() OR error(err). Once terminated, no further emissions can occur.'
        },
        {
          title: 'Teardown Logic',
          description:
            'The subscriber function returns a cleanup callback. RxJS automatically executes this teardown upon unsubscription or stream termination to release resources.'
        }
      ],
      sections: [
        {
          title: 'Synchronous vs. Asynchronous Evaluation',
          content:
            'A common misconception is that Observables are inherently asynchronous. In reality, Observables are synchronous by default if their producer emits synchronously. They only become async if coupled with asynchronous web APIs (setTimeout, fetch, requestAnimationFrame).'
        },
        {
          title: 'Independent Unicast Execution',
          content:
            'By default, plain Observables are unicast: each call to .subscribe() invokes the blueprint function afresh. Multiple subscribers receive their own independent execution lines from the beginning.'
        }
      ],
      takeaways: [
        'Observables are lazy blueprints that do nothing until subscribed.',
        'Observables can be synchronous or asynchronous depending on the producer.',
        'The contract enforces: 0..N next, then 1 complete OR 1 error.',
        'Each subscription runs independently (unicast by default).'
      ]
    },
    code: {
      title: 'Custom Observable with Synchronous, Asynchronous, and Teardown Phases',
      language: 'typescript',
      highlightLines: [5, 10, 15, 18],
      code: `import { Observable } from 'rxjs';

// Creating an Observable from scratch with sync, async, and teardown logic
const customStream$ = new Observable<string>((subscriber) => {
  console.log('>>> Observable Execution Started <<<');

  // 1. Synchronous emission phase
  subscriber.next('Sync Emission 1');
  subscriber.next('Sync Emission 2');

  // 2. Asynchronous emission phase
  const timerId = setTimeout(() => {
    subscriber.next('Async Emission 3 (after 1000ms delay)');
    subscriber.complete(); // Terminal notification closes stream
  }, 1000);

  // 3. Teardown logic: executed upon unsubscription or completion
  return () => {
    clearTimeout(timerId);
    console.log('>>> Teardown: Cleaned up background timer <<<');
  };
});

// Execution only begins when subscribe() is called!
const sub = customStream$.subscribe({
  next: val => console.log('Observer received:', val),
  error: err => console.error('Observer caught error:', err),
  complete: () => console.log('Stream completed!')
});`
    },
    comparison: {
      features: [
        { id: 'execution', label: 'Execution Timing', description: 'When computation starts' },
        { id: 'values', label: 'Cardinality', description: 'Number of items emitted' },
        { id: 'synchronicity', label: 'Synchronicity', description: 'Sync or async execution capability' },
        { id: 'isolation', label: 'Consumer Isolation', description: 'Shared vs independent execution' },
        { id: 'lifecycle', label: 'Disposal Mechanism', description: 'How resources are released' }
      ],
      items: [
        {
          id: 'array',
          name: 'Array',
          recommendedUse: 'Static in-memory data collections',
          characteristics: {
            execution: { text: 'Eager in-memory', status: 'neutral' },
            values: { text: 'Multiple (fixed size)', status: 'neutral' },
            synchronicity: { text: 'Synchronous only', status: 'neutral' },
            isolation: { text: 'Shared reference', status: 'neutral' },
            lifecycle: { text: 'Garbage collected', status: 'positive' }
          }
        },
        {
          id: 'generator',
          name: 'Generator',
          recommendedUse: 'Stepped iteration over memory-efficient series',
          characteristics: {
            execution: { text: 'Lazy on pull (.next())', status: 'positive' },
            values: { text: 'Multiple (stepped)', status: 'positive' },
            synchronicity: { text: 'Sync or Async iterators', status: 'positive' },
            isolation: { text: 'Shared iterator position', status: 'neutral' },
            lifecycle: { text: 'Iterator .return()', status: 'neutral' }
          }
        },
        {
          id: 'observable',
          name: 'RxJS Observable',
          badge: 'Push Blueprint',
          recommendedUse: 'Lazy asynchronous stream sequences with explicit teardown',
          characteristics: {
            execution: { text: 'Lazy on subscribe', status: 'positive' },
            values: { text: '0 to Infinite values', status: 'positive' },
            synchronicity: { text: 'Synchronous OR Asynchronous', status: 'positive' },
            isolation: { text: 'Independent per subscriber (unicast)', status: 'positive' },
            lifecycle: { text: 'Explicit teardown callback', status: 'positive' }
          }
        }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'Are RxJS Observables inherently asynchronous?',
        options: [
          { id: 'a', text: 'Yes, all Observables use setTimeout internally' },
          { id: 'b', text: 'No, Observables can deliver values synchronously or asynchronously depending on producer implementation' },
          { id: 'c', text: 'Only Subject is asynchronous' },
          { id: 'd', text: 'Observables are only asynchronous when used inside Angular components' }
        ],
        correctOptionId: 'b',
        explanation:
          'Observables execute synchronously unless an asynchronous API (like setTimeout, Promise, or asyncScheduler) is explicitly used inside the producer.'
      },
      {
        id: 'q2',
        question: 'What is guaranteed by the Observable Notification Contract?',
        options: [
          { id: 'a', text: 'An Observable must always emit at least one value' },
          { id: 'b', text: 'After emitting complete or error, an Observable will never emit any more next values' },
          { id: 'c', text: 'Complete and error can be emitted together' },
          { id: 'd', text: 'Error events automatically retry the stream three times' }
        ],
        correctOptionId: 'b',
        explanation:
          'The Observable contract guarantees zero or more next notifications, terminated by at most one complete or one error event. After termination, no further events occur.'
      },
      {
        id: 'q3',
        question: 'What does the return value of the new Observable(subscriber => { ... }) callback represent?',
        options: [
          { id: 'a', text: 'The initial value to emit' },
          { id: 'b', text: 'The teardown/cleanup logic executed when the subscription is cancelled or closed' },
          { id: 'c', text: 'The error handler function' },
          { id: 'd', text: 'The retry policy configuration' }
        ],
        correctOptionId: 'b',
        explanation:
          'The function returned by the subscriber callback is the teardown logic. RxJS executes this when the subscriber calls .unsubscribe() or when the stream terminates.'
      },
      {
        id: 'q4',
        question: 'If two subscribers subscribe to the same plain Observable 5 seconds apart, what happens by default?',
        options: [
          { id: 'a', text: 'The second subscriber receives the same values at the same time as the first' },
          { id: 'b', text: 'Each subscriber triggers a separate, independent execution of the Observable function from the beginning' },
          { id: 'c', text: 'The second subscriber throws a MultiSubscriptionError' },
          { id: 'd', text: 'The first subscriber is automatically cancelled' }
        ],
        correctOptionId: 'b',
        explanation:
          'By default, plain Observables are unicast and cold. Each subscription invokes the producer constructor function independently from scratch.'
      }
    ],
    demo: {
      type: 'what-is-observable',
      title: 'Observable Blueprint & Unicast Execution Lab',
      description: 'Observe how creating an Observable blueprint causes 0 emissions until independent Observers subscribe.'
    }
  },

  'observable-vs-promise': {
    id: 'observable-vs-promise',
    title: 'Observable vs Promise',
    subtitle: 'In-depth architectural comparison: Eagerness vs Laziness, Cardinality, Native Cancellation, and Retries',
    category: 'Comparison',
    difficulty: 'beginner',
    concept: {
      summary:
        'Both Promises and Observables handle asynchronous operations in JavaScript, but their underlying architectures represent radically different paradigms. Promises are eager, single-value, and non-cancellable, while Observables are lazy, multi-value, and natively cancellable.',
      pillarsTitle: 'Four Decisive Comparison Dimensions',
      pillars: [
        {
          title: 'Eager vs. Lazy',
          description:
            'A Promise executes its executor immediately upon declaration, before .then() is called. An Observable executes its producer only when .subscribe() is explicitly called.'
        },
        {
          title: 'Single Value vs. Stream',
          description:
            'A Promise resolves to exactly one single value or rejection. An Observable can emit 0, 1, or infinite values over time.'
        },
        {
          title: 'Non-Cancellable vs. Cancellable',
          description:
            'Native Promises cannot be cancelled once initiated. Observables are natively cancellable via .unsubscribe(), which triggers teardown logic to abort requests.'
        },
        {
          title: 'Chaining vs. 100+ Operators',
          description:
            'Promises offer basic .then(), .catch(), .finally(). Observables offer pipeable operators for debouncing, throttling, buffering, retry backoff, and flattening.'
        }
      ],
      sections: [
        {
          title: 'Cancellation and Memory Leak Prevention',
          content:
            'When a user navigates away from an Angular route, in-flight HTTP requests backed by Observables can be cleanly aborted via takeUntilDestroyed() or unsubscribe(). With Promises, the async operation continues running in the background until completion.'
        },
        {
          title: 'Converting Between Promises and Observables',
          content:
            'Use from(promise) to convert a Promise into an Observable that emits once and completes. Use firstValueFrom(obs$) or lastValueFrom(obs$) to convert an Observable back to a Promise.'
        }
      ],
      takeaways: [
        'Promises are eager: they run on instantiation. Observables are lazy: they run on subscribe.',
        'Promises emit exactly 1 value. Observables emit 0 to infinite values.',
        'Observables are natively cancellable via unsubscribe(), aborting in-flight work.',
        'Use Promises for simple one-off tasks; use Observables for streaming, cancellation, and rich pipelines.'
      ]
    },
    code: {
      title: 'Direct Comparison: Eager Promise vs. Cancellable Observable',
      language: 'typescript',
      highlightLines: [4, 11, 20, 26],
      code: `import { Observable, from } from 'rxjs';

// 1. PROMISE: Eager, single-value, non-cancellable
const eagerPromise = new Promise<number>((resolve) => {
  console.log('Promise executor runs IMMEDIATELY upon creation!');
  setTimeout(() => resolve(42), 2000);
});
// Notice: The timer is already ticking here, even without .then()!

// 2. OBSERVABLE: Lazy, multi-value, cancellable
const countdown$ = new Observable<number>((subscriber) => {
  console.log('Observable executor runs ONLY when subscribed!');
  let count = 5;

  const intervalId = setInterval(() => {
    subscriber.next(count);
    count--;
    if (count < 0) {
      clearInterval(intervalId);
      subscriber.complete();
    }
  }, 1000);

  // Teardown callback triggered on cancellation
  return () => {
    clearInterval(intervalId);
    console.log('Teardown: Interval aborted immediately upon unsubscription!');
  };
});

// Subscribe and cancel after 2.5 seconds
const sub = countdown$.subscribe(val => console.log('Countdown tick:', val));
setTimeout(() => {
  console.log('Calling sub.unsubscribe() to cancel stream...');
  sub.unsubscribe();
}, 2500);`
    },
    comparison: {
      features: [
        { id: 'eagerness', label: 'Evaluation', description: 'When does execution begin' },
        { id: 'cardinality', label: 'Value Cardinality', description: 'Number of values delivered' },
        { id: 'cancellation', label: 'Native Cancellation', description: 'Ability to halt execution' },
        { id: 'execution', label: 'Execution Model', description: 'Unicast vs multicast execution' },
        { id: 'operators', label: 'Transformation', description: 'Ecosystem of composable operators' },
        { id: 'delivery', label: 'Delivery Model', description: 'Synchronicity of emissions' },
        { id: 'retry', label: 'Native Retry', description: 'Re-executing failed operations' }
      ],
      items: [
        {
          id: 'promise',
          name: 'Promise',
          recommendedUse: 'One-off async operations without cancellation or streaming',
          characteristics: {
            eagerness: { text: 'Eager (executes on definition)', status: 'neutral' },
            cardinality: { text: 'Exactly 1 value', status: 'neutral' },
            cancellation: { text: 'No native cancellation', status: 'negative' },
            execution: { text: 'Multicast (shares resolved value)', status: 'neutral' },
            operators: { text: 'Limited (.then, .catch, .finally)', status: 'negative' },
            delivery: { text: 'Always asynchronous microtask', status: 'neutral' },
            retry: { text: 'No (manual recursion required)', status: 'negative' }
          }
        },
        {
          id: 'observable',
          name: 'RxJS Observable',
          badge: 'Stream Primitive',
          recommendedUse: 'Streaming data, cancellable operations, real-time UI events',
          characteristics: {
            eagerness: { text: 'Lazy (executes on subscribe)', status: 'positive' },
            cardinality: { text: '0, 1, or Multiple values', status: 'positive' },
            cancellation: { text: 'Native via .unsubscribe()', status: 'positive' },
            execution: { text: 'Unicast by default (multicast optional)', status: 'positive' },
            operators: { text: '100+ Composable pipe operators', status: 'positive' },
            delivery: { text: 'Synchronous or Asynchronous', status: 'positive' },
            retry: { text: 'Native via retry(), retryWhen()', status: 'positive' }
          }
        }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What happens when a Promise is created without calling .then()?',
        options: [
          { id: 'a', text: 'The executor function never executes' },
          { id: 'b', text: 'The executor function runs immediately regardless of .then()' },
          { id: 'c', text: 'The JavaScript runtime throws an UnhandledPromiseWarning' },
          { id: 'd', text: 'It converts to an Observable' }
        ],
        correctOptionId: 'b',
        explanation:
          'Promises are eager. The executor callback passed to the Promise constructor begins execution synchronously the moment it is declared.'
      },
      {
        id: 'q2',
        question: 'Can a Promise emit multiple values over time?',
        options: [
          { id: 'a', text: 'Yes, by calling resolve() multiple times' },
          { id: 'b', text: 'No, resolve() can only be called once; subsequent calls are silently ignored' },
          { id: 'c', text: 'Yes, using async/await' },
          { id: 'd', text: 'Only when wrapped in an array' }
        ],
        correctOptionId: 'b',
        explanation:
          'A Promise represents a single eventual value or failure. Calling resolve() a second time has no effect.'
      },
      {
        id: 'q3',
        question: 'How does unsubscription cancel an Observable HTTP request?',
        options: [
          { id: 'a', text: 'It crashes the Angular browser tab' },
          { id: 'b', text: 'It triggers the Observable teardown function, which aborts the underlying XMLHttpRequest/fetch request' },
          { id: 'c', text: 'It tells the backend server to delete the database entry' },
          { id: 'd', text: 'It cannot cancel network requests' }
        ],
        correctOptionId: 'b',
        explanation:
          'In RxJS, unsubscription executes the teardown logic returned by the Observable producer, which in HTTP implementations invokes AbortController.abort() or xhr.abort().'
      },
      {
        id: 'q4',
        question: 'When should you prefer a Promise over an Observable?',
        options: [
          { id: 'a', text: 'For streaming WebSocket messages' },
          { id: 'b', text: 'For simple one-off asynchronous operations where cancellation, streaming, and complex operators are not required' },
          { id: 'c', text: 'For handling user form input debouncing' },
          { id: 'd', text: 'Never; Promises are obsolete in modern JavaScript' }
        ],
        correctOptionId: 'b',
        explanation:
          'For simple, one-shot async operations (like simple dynamic imports or basic scripts) where no streaming, cancellation, or retries are needed, Promises offer simple async/await syntax.'
      }
    ],
    demo: {
      type: 'observable-vs-promise',
      title: 'Dual Race & Cancellation Chamber',
      description: 'Trigger an eager Promise and a lazy Observable side-by-side to experience unpreventable Promise resolution vs clean Observable cancellation.'
    }
  },

  'observer-subscriber': {
    id: 'observer-subscriber',
    title: 'Observer & Subscriber',
    subtitle: 'Consumer contracts, SafeSubscriber protection, and exception shielding',
    category: 'Fundamentals',
    difficulty: 'beginner',
    concept: {
      summary:
        'An Observer is a simple consumer interface containing three optional callbacks: next(), error(), and complete(). A Subscriber is the concrete RxJS class that wraps an Observer and extends Subscription. RxJS transparently wraps user observers in a SafeSubscriber to enforce the stream contract.',
      pillarsTitle: 'The Three Shielding Duties of SafeSubscriber',
      pillars: [
        {
          title: 'Notification Contract Enforcement',
          description:
            'If a rogue producer attempts to call subscriber.next() after calling subscriber.complete() or subscriber.error(), SafeSubscriber silently intercepts and drops the notification.'
        },
        {
          title: 'Exception Shielding',
          description:
            'If user code inside next() throws an unhandled error, SafeSubscriber catches the exception, routes it to the error handler, and triggers automatic unsubscription to prevent zombie leaks.'
        },
        {
          title: 'Automatic Teardown on Terminal Notification',
          description:
            'When complete() or error() is emitted, SafeSubscriber automatically invokes all teardown hooks without requiring manual subscriber cleanup.'
        }
      ],
      sections: [
        {
          title: 'Structural Relationship: Subscriber vs Observer vs Subscription',
          content:
            'In RxJS class hierarchy: Subscriber implements Observer (next, error, complete) AND extends Subscription (unsubscribe, closed, add). This enables a Subscriber to act as both consumer and lifecycle controller.'
        },
        {
          title: 'Partial Observers',
          content:
            'All observer callbacks are optional. Passing { next: v => ... } or only { error: err => ... } is fully valid; RxJS defaults missing handlers to safe no-ops.'
        }
      ],
      takeaways: [
        'An Observer is a plain JS interface with optional next, error, complete callbacks.',
        'Subscriber implements Observer and extends Subscription.',
        'SafeSubscriber prevents notifications after stream completion.',
        'Exceptions thrown inside next() are caught and forwarded to error().'
      ]
    },
    code: {
      title: 'SafeSubscriber Enforcing Observable Contract and Shielding Exceptions',
      language: 'typescript',
      highlightLines: [8, 12, 16],
      code: `import { Observable, Observer } from 'rxjs';

// 1. Defining a standard Observer object with optional callbacks
const myObserver: Observer<number> = {
  next: val => console.log('Observer received next:', val),
  error: err => console.error('Observer caught error:', err),
  complete: () => console.log('Observer completed successfully!')
};

// 2. SafeSubscriber demonstration: Discarding illegal notifications
const rogueStream$ = new Observable<number>((subscriber) => {
  subscriber.next(10);
  subscriber.next(20);
  subscriber.complete(); // Terminal notification closes stream

  // ILLEGAL: Emitting after complete!
  // SafeSubscriber intercepts and silently drops these to protect consumers:
  subscriber.next(999);
  subscriber.error(new Error('Ignored rogue error'));
});

rogueStream$.subscribe(myObserver);`
    },
    comparison: {
      features: [
        { id: 'nature', label: 'Architecture Type', description: 'Interface vs class definition' },
        { id: 'teardown', label: 'Disposable Capability', description: 'Can unsubscribe or close' },
        { id: 'contract', label: 'Contract Enforcement', description: 'Drops calls after complete/error' },
        { id: 'exceptions', label: 'Exception Handling', description: 'Catches errors thrown in user code' },
        { id: 'role', label: 'System Role', description: 'Primary purpose in architecture' }
      ],
      items: [
        {
          id: 'observer',
          name: 'Observer',
          recommendedUse: 'Passive consumer interface passed to .subscribe()',
          characteristics: {
            nature: { text: 'Plain JS Interface', status: 'neutral' },
            teardown: { text: 'No (pure consumer)', status: 'negative' },
            contract: { text: 'No (passive callbacks)', status: 'negative' },
            exceptions: { text: 'Unhandled crash if next() throws', status: 'negative' },
            role: { text: 'Consumer interface contract', status: 'neutral' }
          }
        },
        {
          id: 'subscriber',
          name: 'Subscriber',
          recommendedUse: 'Base class for pipeline operators and custom stream listeners',
          characteristics: {
            nature: { text: 'RxJS Class (extends Subscription)', status: 'positive' },
            teardown: { text: 'Yes (manages subscription state)', status: 'positive' },
            contract: { text: 'Basic subscription tracking', status: 'neutral' },
            exceptions: { text: 'Forwarded down the pipeline', status: 'neutral' },
            role: { text: 'Bridge between source and sink', status: 'positive' }
          }
        },
        {
          id: 'safe-subscriber',
          name: 'SafeSubscriber',
          badge: 'Protective Wrapper',
          recommendedUse: 'Internal shield automatically wrapped around every observer',
          characteristics: {
            nature: { text: 'Internal RxJS Wrapper', status: 'positive' },
            teardown: { text: 'Yes (handles auto-cleanup)', status: 'positive' },
            contract: { text: 'Strict (drops illegal calls after terminal)', status: 'positive' },
            exceptions: { text: 'Intercepts and routes to error()', status: 'positive' },
            role: { text: 'Protective runtime shield', status: 'positive' }
          }
        }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What happens if an Observable producer calls subscriber.next(100) after calling subscriber.complete()?',
        options: [
          { id: 'a', text: 'An UncaughtException crashes the browser' },
          { id: 'b', text: 'The SafeSubscriber safely intercepts and ignores the notification' },
          { id: 'c', text: 'The complete state is reverted back to active' },
          { id: 'd', text: 'The subscriber reopens the stream' }
        ],
        correctOptionId: 'b',
        explanation:
          'SafeSubscriber enforces the Observable contract. Any notifications emitted after complete() or error() are discarded.'
      },
      {
        id: 'q2',
        question: 'Which methods of the Observer interface are mandatory when subscribing?',
        options: [
          { id: 'a', text: 'All three: next, error, and complete' },
          { id: 'b', text: 'Only next is required; error and complete are optional' },
          { id: 'c', text: 'None; all three callbacks are optional (partial observer)' },
          { id: 'd', text: 'next and error are mandatory' }
        ],
        correctOptionId: 'c',
        explanation:
          'In RxJS, all observer callbacks (next, error, complete) are optional. You can subscribe with {} or just { next: v => ... }.'
      },
      {
        id: 'q3',
        question: 'What is the structural relationship between Subscriber, Observer, and Subscription?',
        options: [
          { id: 'a', text: 'Subscriber implements Observer and extends Subscription' },
          { id: 'b', text: 'Subscription extends Subscriber' },
          { id: 'c', text: 'Observer extends Subscriber' },
          { id: 'd', text: 'They are three independent, unrelated interfaces' }
        ],
        correctOptionId: 'a',
        explanation:
          'In RxJS, Subscriber implements the Observer interface (next, error, complete) and extends the Subscription class (unsubscribe, closed, add).'
      },
      {
        id: 'q4',
        question: 'If a subscriber next callback throws an uncaught JavaScript error, what does SafeSubscriber do?',
        options: [
          { id: 'a', text: 'Freezes the entire webpage' },
          { id: 'b', text: 'Catches the error, routes it to the observer error handler, and unbinds resources' },
          { id: 'c', text: 'Silently swallows the error and continues emitting' },
          { id: 'd', text: 'Retries the next callback 3 times' }
        ],
        correctOptionId: 'b',
        explanation:
          'SafeSubscriber provides exception shielding: if user code in next throws an unhandled error, it safely redirects execution to error() and terminates the subscription.'
      }
    ],
    demo: {
      type: 'observer-subscriber',
      title: 'Observer Contract Enforcement & Exception Shield Sandbox',
      description: 'Test emitting legal vs illegal values after complete/error, and see how SafeSubscriber catches unhandled UI exceptions.'
    }
  },

  'subscription-lifecycle': {
    id: 'subscription-lifecycle',
    title: 'Subscription Lifecycle',
    subtitle: 'Teardown cascades, composite subscription trees, and modern Angular 20 memory leak prevention',
    category: 'Fundamentals',
    difficulty: 'intermediate',
    concept: {
      summary:
        'A Subscription represents the execution of an Observable and controls its lifecycle. Failing to unsubscribe from infinite Observables retains component references in closures, resulting in severe memory leaks. Angular 20 provides modern primitives (takeUntilDestroyed, toSignal) to automate teardown.',
      pillarsTitle: 'The 4 Phases of Subscription Lifecycle',
      pillars: [
        {
          title: '1. Instantiation & Execution',
          description:
            'observable.subscribe() creates a Subscriber, initializes teardown lists, and invokes the producer function.'
        },
        {
          title: '2. Active Streaming',
          description:
            'Producer actively pushes notifications to the subscriber over time.'
        },
        {
          title: '3. Teardown & Cascading',
          description:
            'Stream completes, errors, or consumer calls subscription.unsubscribe(). All teardown functions execute in reverse registration order.'
        },
        {
          title: '4. Closed State',
          description:
            'Subscription sets closed = true. All child references are cleared and subsequent calls to unsubscribe() are safe no-ops.'
        }
      ],
      sections: [
        {
          title: 'Composite Subscriptions (sub.add)',
          content:
            'Subscription.prototype.add(childSub) builds hierarchical subscription trees. Calling parent.unsubscribe() automatically cascades down, unsubscribing every child and executing all registered cleanup callbacks.'
        },
        {
          title: 'Angular 20 Best Practices',
          content:
            'Modern Angular applications replace manual ngOnDestroy boilerplate with takeUntilDestroyed() bound to DestroyRef, or convert streams directly to signals using toSignal().'
        }
      ],
      takeaways: [
        'Infinite streams (interval, fromEvent, router events) must be torn down to prevent leaks.',
        'Composite subscriptions (sub.add) allow tearing down an entire tree with a single call.',
        'Subscription.unsubscribe() is idempotent: calling it multiple times is safe.',
        'Angular 20 takeUntilDestroyed() automatically binds unsubscription to DestroyRef.'
      ]
    },
    code: {
      title: 'Angular 20 Lifecycle Teardown Patterns',
      language: 'typescript',
      highlightLines: [8, 14, 20],
      code: `import { Component, inject, DestroyRef, OnInit } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-lifecycle-demo',
  standalone: true,
  template: \`<div>Active Subscriptions Demo</div>\`
})
export class LifecycleDemoComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  // Strategy 1: Angular 20 takeUntilDestroyed (Recommended!)
  // Automatically tears down when component is destroyed:
  readonly timer$ = interval(1000).pipe(
    takeUntilDestroyed()
  ).subscribe(tick => console.log('Angular 20 Safe Tick:', tick));

  // Strategy 2: Composite Subscription Tree (Manual)
  private compositeSub = new Subscription();

  ngOnInit() {
    const sub1 = interval(500).subscribe(v => console.log('Sub1:', v));
    const sub2 = interval(1000).subscribe(v => console.log('Sub2:', v));

    // Compose child subscriptions under one parent:
    this.compositeSub.add(sub1);
    this.compositeSub.add(sub2);
    this.compositeSub.add(() => console.log('Custom resource teardown callback!'));

    // Link composite teardown to DestroyRef:
    this.destroyRef.onDestroy(() => {
      this.compositeSub.unsubscribe();
    });
  }
}`
    },
    comparison: {
      features: [
        { id: 'mechanism', label: 'Disposal Mechanism', description: 'How teardown is triggered' },
        { id: 'leakRisk', label: 'Memory Leak Risk', description: 'Likelihood of developer omission' },
        { id: 'boilerplate', label: 'Boilerplate Overhead', description: 'Lines of code required' },
        { id: 'zoneless', label: 'Zoneless Compatible', description: 'Works in zoneless Angular' },
        { id: 'angularContext', label: 'Injection Context', description: 'Requires active injection context' }
      ],
      items: [
        {
          id: 'manual',
          name: 'Manual .unsubscribe()',
          recommendedUse: 'Standalone services or non-Angular scripts',
          characteristics: {
            mechanism: { text: 'Individual variable per sub', status: 'neutral' },
            leakRisk: { text: 'High (easy to forget in ngOnDestroy)', status: 'negative' },
            boilerplate: { text: 'High (ngOnDestroy boilerplate)', status: 'negative' },
            zoneless: { text: 'Yes', status: 'positive' },
            angularContext: { text: 'No', status: 'positive' }
          }
        },
        {
          id: 'composite',
          name: 'Subscription.add()',
          recommendedUse: 'Managing groups of related subscriptions',
          characteristics: {
            mechanism: { text: 'Composite subscription tree', status: 'positive' },
            leakRisk: { text: 'Medium (must still call parent unsubscribe)', status: 'neutral' },
            boilerplate: { text: 'Moderate', status: 'neutral' },
            zoneless: { text: 'Yes', status: 'positive' },
            angularContext: { text: 'No', status: 'positive' }
          }
        },
        {
          id: 'takeUntilDestroyed',
          name: 'takeUntilDestroyed()',
          badge: 'Angular 20 Standard',
          recommendedUse: 'Standard declarative stream teardown in components and directives',
          characteristics: {
            mechanism: { text: 'Bound to Angular DestroyRef', status: 'positive' },
            leakRisk: { text: 'Zero (automated by Angular)', status: 'positive' },
            boilerplate: { text: 'Minimal (1 line in pipe)', status: 'positive' },
            zoneless: { text: 'Yes', status: 'positive' },
            angularContext: { text: 'Yes (or pass explicit DestroyRef)', status: 'neutral' }
          }
        },
        {
          id: 'toSignal',
          name: 'toSignal()',
          badge: 'Reactive Bridge',
          recommendedUse: 'Exposing stream state to modern zoneless templates',
          characteristics: {
            mechanism: { text: 'Signal conversion with internal lifecycle', status: 'positive' },
            leakRisk: { text: 'Zero (managed internally)', status: 'positive' },
            boilerplate: { text: 'Lowest (pure declarative binding)', status: 'positive' },
            zoneless: { text: 'Yes', status: 'positive' },
            angularContext: { text: 'Yes (or pass Injector)', status: 'neutral' }
          }
        }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What happens to child subscriptions added via parentSub.add(childSub) when parentSub.unsubscribe() is called?',
        options: [
          { id: 'a', text: 'Child subscriptions continue running until completed' },
          { id: 'b', text: 'All child subscriptions and teardown callbacks are executed and closed automatically' },
          { id: 'c', text: 'An error is thrown if child subscriptions are still active' },
          { id: 'd', text: 'Only the first child subscription is unsubscribed' }
        ],
        correctOptionId: 'b',
        explanation:
          'Composite subscriptions cascade unsubscription down to all children registered via .add(), closing all child subscriptions and executing cleanup functions.'
      },
      {
        id: 'q2',
        question: 'What is the most common consequence of failing to unsubscribe from an infinite Observable in an Angular component?',
        options: [
          { id: 'a', text: 'The browser closes automatically' },
          { id: 'b', text: 'Memory leaks because closures keep the destroyed component instance in memory' },
          { id: 'c', text: 'Angular compiles with an AOT error' },
          { id: 'd', text: 'HTTP requests fail with status 404' }
        ],
        correctOptionId: 'b',
        explanation:
          'Infinite observables retain references to component methods in their callback closures. If not unsubscribed, the garbage collector cannot collect the component, leading to cumulative memory leaks.'
      },
      {
        id: 'q3',
        question: 'What requirement must be met when calling takeUntilDestroyed() without passing an explicit DestroyRef?',
        options: [
          { id: 'a', text: 'It must be called inside an injection context (e.g. field initializer or constructor)' },
          { id: 'b', text: 'It can only be called in ngOnDestroy' },
          { id: 'c', text: 'It requires zone.js to be enabled' },
          { id: 'd', text: 'It must be used inside a Promise' }
        ],
        correctOptionId: 'a',
        explanation:
          'takeUntilDestroyed() injects DestroyRef by default. Therefore, if called without an explicit parameter, it must be executed within an active Angular injection context.'
      },
      {
        id: 'q4',
        question: 'Is calling .unsubscribe() on an already closed subscription safe?',
        options: [
          { id: 'a', text: 'No, it throws an ObjectUnsubscribedError' },
          { id: 'b', text: 'Yes, unsubscription is idempotent; repeated calls are no-ops' },
          { id: 'c', text: 'It causes a memory leak' },
          { id: 'd', text: 'It restarts the stream' }
        ],
        correctOptionId: 'b',
        explanation:
          'Calling unsubscribe() on a closed subscription is safe and idempotent in RxJS; it simply does nothing if closed === true.'
      }
    ],
    demo: {
      type: 'subscription-lifecycle',
      title: 'Subscription Tree & Teardown Cascade Visualizer',
      description: 'Inspect a hierarchical composite subscription tree and observe how parent unsubscription cascades across child streams.'
    }
  },

  'cold-vs-hot': {
    id: 'cold-vs-hot',
    title: 'Cold vs Hot Observables',
    subtitle: 'Where data producers live: unicast on-demand execution vs shared multicast event streams',
    category: 'Fundamentals',
    difficulty: 'intermediate',
    concept: {
      summary:
        'The fundamental difference between Cold and Hot Observables is where and when the data producer is created. A Cold Observable instantiates the producer inside the subscription callback (unicast, separate execution per subscriber). A Hot Observable binds to an external producer that emits regardless of subscribers (multicast, shared execution).',
      pillarsTitle: 'The Movie vs Live Concert Analogy',
      pillars: [
        {
          title: 'Cold Observable (Netflix on Demand)',
          description:
            'When you press play, the movie starts at 00:00 for you. If someone else watches 10 minutes later, their movie also starts at 00:00. Examples: HttpClient.get(), of(), from(), interval().'
        },
        {
          title: 'Hot Observable (Live Radio Broadcast)',
          description:
            'The radio station transmits regardless of who is tuned in. If you tune in 15 minutes late, you missed the opening tracks and only hear what is playing now. Examples: fromEvent(document), WebSocket feeds, Subject.'
        },
        {
          title: 'Warm Observables',
          description:
            'A Cold Observable transformed into a shared multicast stream via operators like share() or shareReplay().'
        }
      ],
      sections: [
        {
          title: 'Why HttpClient.get() is Cold',
          content:
            'In Angular, HttpClient methods return cold Observables. Subscribing to an HTTP observable 3 times triggers 3 independent network requests. Multicasting with shareReplay() is required to share one network request among multiple subscribers.'
        },
        {
          title: 'Late Subscriber Behavior',
          content:
            'In a cold stream, late subscribers receive the complete sequence from the beginning. In a plain hot stream, late subscribers only receive future emissions occurring after subscription.'
        }
      ],
      takeaways: [
        'Cold: Producer created inside observable -> Unicast, independent per subscriber.',
        'Hot: Producer created outside observable -> Multicast, shared among all subscribers.',
        'Angular HttpClient is cold: every subscription initiates a separate HTTP call.',
        'Use share() or shareReplay() to convert cold observables into shared streams.'
      ]
    },
    code: {
      title: 'Cold Observable (Unicast) vs. Hot Observable (Multicast)',
      language: 'typescript',
      highlightLines: [4, 14, 20],
      code: `import { Observable, fromEvent } from 'rxjs';

// 1. COLD OBSERVABLE: Producer created INSIDE
const coldRandom$ = new Observable<number>((subscriber) => {
  // Fresh random number generated per subscription
  const randomValue = Math.random();
  subscriber.next(randomValue);
  subscriber.complete();
});

// Each subscriber receives a completely different random value:
coldRandom$.subscribe(v => console.log('Cold Sub 1:', v)); // e.g. 0.4281
coldRandom$.subscribe(v => console.log('Cold Sub 2:', v)); // e.g. 0.9124 (DIFFERENT!)

// 2. HOT OBSERVABLE: Producer created OUTSIDE
// The browser window emits click events whether or not we subscribe:
const hotClicks$ = fromEvent<MouseEvent>(document, 'click');

// Both subscribers share the EXACT same mouse events:
hotClicks$.subscribe(e => console.log('Hot Sub 1 click at:', e.clientX));
hotClicks$.subscribe(e => console.log('Hot Sub 2 click at:', e.clientX));`
    },
    comparison: {
      features: [
        { id: 'producerLocation', label: 'Producer Origin', description: 'Where producer is instantiated' },
        { id: 'dataSharing', label: 'Data Distribution', description: 'Unicast vs multicast' },
        { id: 'lateSubscribers', label: 'Late Subscriber Experience', description: 'What late subscribers receive' },
        { id: 'resourceUsage', label: 'Resource Allocation', description: 'Execution duplication overhead' },
        { id: 'typicalUseCases', label: 'Primary Use Cases', description: 'Common application scenarios' },
        { id: 'typicalExamples', label: 'Standard Examples', description: 'Built-in RxJS operators' }
      ],
      items: [
        {
          id: 'cold',
          name: 'Cold Observable',
          recommendedUse: 'Isolated operations like HTTP requests, file reads, database queries',
          characteristics: {
            producerLocation: { text: 'Created inside Observable callback', status: 'neutral' },
            dataSharing: { text: 'Unicast (1:1 per subscriber)', status: 'positive' },
            lateSubscribers: { text: 'Receives entire sequence from start', status: 'positive' },
            resourceUsage: { text: 'Multiplied per subscriber', status: 'negative' },
            typicalUseCases: { text: 'HTTP requests, timers, static arrays', status: 'neutral' },
            typicalExamples: { text: 'of(), from(), interval(), HttpClient', status: 'neutral' }
          }
        },
        {
          id: 'hot',
          name: 'Hot Observable',
          badge: 'Shared Stream',
          recommendedUse: 'User interactions, WebSockets, sensor feeds, global event buses',
          characteristics: {
            producerLocation: { text: 'Created outside Observable callback', status: 'neutral' },
            dataSharing: { text: 'Multicast (1:N shared)', status: 'positive' },
            lateSubscribers: { text: 'Misses earlier emissions (sees future only)', status: 'neutral' },
            resourceUsage: { text: 'Shared single producer', status: 'positive' },
            typicalUseCases: { text: 'DOM clicks, WebSocket feeds, ticker bus', status: 'neutral' },
            typicalExamples: { text: 'fromEvent(), Subject, BehaviorSubject', status: 'neutral' }
          }
        },
        {
          id: 'warm',
          name: 'Warm (Multicast)',
          badge: 'Cached Multicast',
          recommendedUse: 'Shared HTTP responses and cached application view state',
          characteristics: {
            producerLocation: { text: 'Cold source shared via operator', status: 'positive' },
            dataSharing: { text: 'Multicast with optional replay buffer', status: 'positive' },
            lateSubscribers: { text: 'Can replay N cached values via shareReplay', status: 'positive' },
            resourceUsage: { text: 'Shared across active subscribers', status: 'positive' },
            typicalUseCases: { text: 'Cached HTTP data, shared stores', status: 'positive' },
            typicalExamples: { text: 'share(), shareReplay({ refCount: true })', status: 'positive' }
          }
        }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What defines whether an Observable is Cold or Hot?',
        options: [
          { id: 'a', text: 'Whether it uses TypeScript or JavaScript' },
          { id: 'b', text: 'Where the producer of data is created (inside the observable vs outside)' },
          { id: 'c', text: 'The number of operators in the pipe' },
          { id: 'd', text: 'Whether it emits numbers or strings' }
        ],
        correctOptionId: 'b',
        explanation:
          'If the producer is created inside the subscription callback, it is Cold (unicast). If the producer exists outside and is shared, it is Hot (multicast).'
      },
      {
        id: 'q2',
        question: 'Is Angular HttpClient.get() cold or hot by default?',
        options: [
          { id: 'a', text: 'Hot, because the server is on the internet' },
          { id: 'b', text: 'Cold, because every subscriber triggers a new, separate HTTP request' },
          { id: 'c', text: 'Warm, because it always caches responses' },
          { id: 'd', text: 'Neither; HttpClient does not return Observables' }
        ],
        correctOptionId: 'b',
        explanation:
          'HttpClient methods return cold Observables. Subscribing three times will execute three separate HTTP requests over the network.'
      },
      {
        id: 'q3',
        question: 'What happens when a subscriber subscribes to a plain hot Subject that has already emitted 5 items?',
        options: [
          { id: 'a', text: 'The subscriber receives all 5 previous items' },
          { id: 'b', text: 'The subscriber only receives items emitted after the moment of subscription' },
          { id: 'c', text: 'An error is thrown' },
          { id: 'd', text: 'The stream terminates immediately' }
        ],
        correctOptionId: 'b',
        explanation:
          'Standard hot streams (and plain Subject) do not store history. Late subscribers only observe events emitted after their subscription is active.'
      },
      {
        id: 'q4',
        question: 'How can a cold Observable (like an HTTP call) be converted into a warm/shared Observable?',
        options: [
          { id: 'a', text: 'By wrapping it in setTimeout()' },
          { id: 'b', text: 'By using multicasting operators such as share() or shareReplay()' },
          { id: 'c', text: 'By casting it to Promise' },
          { id: 'd', text: 'By calling .subscribe() twice' }
        ],
        correctOptionId: 'b',
        explanation:
          'Operators like share() and shareReplay() introduce an internal Subject that multicasts the single underlying cold execution to multiple subscribers.'
      }
    ],
    demo: {
      type: 'cold-vs-hot',
      title: 'Cold vs Hot Synchronous Race Track',
      description: 'Compare independent on-demand playback (Cold) against synchronized live broadcast feeds (Hot).'
    }
  },

  'multicasting': {
    id: 'multicasting',
    title: 'Multicasting Fundamentals',
    subtitle: 'Sharing expensive producers: Subject bridge, share(), and avoiding the shareReplay memory leak trap',
    category: 'Fundamentals',
    difficulty: 'advanced',
    concept: {
      summary:
        'Multicasting shares a single Observable execution among multiple Observers by introducing a Subject intermediary. In Angular apps, multicasting avoids duplicate HTTP calls and expensive re-computations. Mastering modern share() and shareReplay({ refCount: true }) is crucial for performance and leak prevention.',
      pillarsTitle: 'The Three Cornerstones of Modern Multicasting',
      pillars: [
        {
          title: 'The Subject Intermediary',
          description:
            'A Subject acts as both Observer and Observable. It subscribes to the upstream source once and fans out notifications to all downstream consumers.'
        },
        {
          title: 'Reference Counting (refCount)',
          description:
            'Tracks how many observers are subscribed. When subscriber count transitions 0 -> 1, it connects to the upstream source. When it drops to 0, it automatically unsubscribes.'
        },
        {
          title: 'The shareReplay Leak Trap',
          description:
            'In RxJS 7+, calling shareReplay(1) defaults to refCount: false! The internal subscription remains permanently connected even when all components destroy. Always specify shareReplay({ bufferSize: 1, refCount: true }).'
        }
      ],
      sections: [
        {
          title: 'share() vs. shareReplay()',
          content:
            'share() multicasts live real-time emissions; late subscribers only receive future events. shareReplay({ bufferSize: 1, refCount: true }) caches the latest N emissions and replays them immediately to late subscribers.'
        },
        {
          title: 'Reset Policies in RxJS 7+',
          content:
            'Modern share() allows configuring resetOnComplete, resetOnError, and resetOnRefCountZero to control whether the multicasting subject should reset its state when events occur.'
        }
      ],
      takeaways: [
        'Multicasting eliminates redundant executions of expensive operations like HTTP calls.',
        'A Subject bridges the single producer to multiple consumers.',
        'Always specify refCount: true with shareReplay to avoid zombie subscriptions.',
        'Use share() for live events and shareReplay for cached response state.'
      ]
    },
    code: {
      title: 'Multicasting Expensive HTTP Requests with shareReplay',
      language: 'typescript',
      highlightLines: [5, 13, 20],
      code: `import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

// 1. Unshared expensive producer
const expensiveApiCall$ = new Observable<string>((subscriber) => {
  console.log('>>> EXECUTING EXPENSIVE NETWORK FETCH <<<');
  const timerId = setTimeout(() => {
    subscriber.next(JSON.stringify({ userId: 101, role: 'Admin' }));
    subscriber.complete();
  }, 1000);
  return () => clearTimeout(timerId);
});

// 2. Multicasting with safe reference counting
const sharedProfile$ = expensiveApiCall$.pipe(
  // bufferSize: 1 caches latest emission for late subscribers
  // refCount: true unsubscribes from source when all subscribers disconnect!
  shareReplay({ bufferSize: 1, refCount: true })
);

// Component A subscribes -> Triggers the 1 single network request
sharedProfile$.subscribe(data => console.log('Header received:', data));

// Component B subscribes later -> Instantly receives cached value with 0 network calls!
sharedProfile$.subscribe(data => console.log('Sidebar received:', data));`
    },
    comparison: {
      features: [
        { id: 'caching', label: 'Emission Caching', description: 'Replays past emissions' },
        { id: 'lateArrivals', label: 'Late Subscriber Reception', description: 'Experience for new subscribers' },
        { id: 'refCountTeardown', label: 'Teardown on 0 Consumers', description: 'Unsubscribes when count reaches 0' },
        { id: 'leakRisk', label: 'Memory Leak Risk', description: 'Risk of permanent connection' },
        { id: 'bestFor', label: 'Recommended Use Case', description: 'Application scenario' }
      ],
      items: [
        {
          id: 'unshared',
          name: 'Unshared Cold',
          recommendedUse: 'Isolated actions where execution must not be shared',
          characteristics: {
            caching: { text: 'None', status: 'neutral' },
            lateArrivals: { text: 'Waits for new trigger from start', status: 'neutral' },
            refCountTeardown: { text: 'Natural per-subscription cleanup', status: 'positive' },
            leakRisk: { text: 'None', status: 'positive' },
            bestFor: { text: 'Isolated, unshared mutations', status: 'neutral' }
          }
        },
        {
          id: 'share',
          name: 'share()',
          badge: 'Real-Time Multicast',
          recommendedUse: 'Real-time event streams like WebSockets and telemetry',
          characteristics: {
            caching: { text: 'No cache (real-time only)', status: 'neutral' },
            lateArrivals: { text: 'Misses prior emissions', status: 'neutral' },
            refCountTeardown: { text: 'Yes (resets on refCount: 0)', status: 'positive' },
            leakRisk: { text: 'Low', status: 'positive' },
            bestFor: { text: 'Real-time event multicasting', status: 'positive' }
          }
        },
        {
          id: 'shareReplaySafe',
          name: 'shareReplay({ refCount: true })',
          badge: 'Safe Cache Standard',
          recommendedUse: 'HTTP caching and shared component view models in Angular',
          characteristics: {
            caching: { text: 'Caches latest N items', status: 'positive' },
            lateArrivals: { text: 'Instantly receives cached value', status: 'positive' },
            refCountTeardown: { text: 'Yes (cleans up when subscribers hit 0)', status: 'positive' },
            leakRisk: { text: 'Low', status: 'positive' },
            bestFor: { text: 'HTTP response caching & view state', status: 'positive' }
          }
        },
        {
          id: 'shareReplayUnsafe',
          name: 'shareReplay({ refCount: false })',
          recommendedUse: 'App-lifetime immutable configuration data only',
          characteristics: {
            caching: { text: 'Caches latest N items', status: 'positive' },
            lateArrivals: { text: 'Instantly receives cached value', status: 'positive' },
            refCountTeardown: { text: 'No (remains permanently connected!)', status: 'negative' },
            leakRisk: { text: 'High (zombie source leaks in SPAs)', status: 'negative' },
            bestFor: { text: 'Immutable app-wide configs only', status: 'neutral' }
          }
        }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What architectural role does a Subject play in multicasting?',
        options: [
          { id: 'a', text: 'It replaces the browser network card' },
          { id: 'b', text: 'It acts as an intermediate bridge: an Observer to the source and an Observable to multiple downstream subscribers' },
          { id: 'c', text: 'It converts synchronous code into Web Workers' },
          { id: 'd', text: 'It encrypts the data stream' }
        ],
        correctOptionId: 'b',
        explanation:
          'In multicasting, a Subject sits in the middle. It subscribes once to the source observable and fans out the emissions to multiple downstream observers.'
      },
      {
        id: 'q2',
        question: 'Why is shareReplay(1) potentially dangerous in an Angular single-page application if refCount is not specified?',
        options: [
          { id: 'a', text: 'It causes a compilation error in Angular 20' },
          { id: 'b', text: 'In RxJS 7+, refCount defaults to false, meaning the source stream never unsubscribes even when all components destroy' },
          { id: 'c', text: 'It can only store strings' },
          { id: 'd', text: 'It slows down garbage collection of static assets' }
        ],
        correctOptionId: 'b',
        explanation:
          'When refCount is false, shareReplay maintains its internal subscription to the source indefinitely, creating zombie subscriptions if components unmount.'
      },
      {
        id: 'q3',
        question: 'If three Angular components concurrently subscribe to an HTTP request observable piped through shareReplay({ bufferSize: 1, refCount: true }), how many HTTP requests are made?',
        options: [
          { id: 'a', text: 'Three separate requests' },
          { id: 'b', text: 'Exactly one HTTP request' },
          { id: 'c', text: 'Zero requests' },
          { id: 'd', text: 'Two requests' }
        ],
        correctOptionId: 'b',
        explanation:
          'shareReplay multicasts the initial execution. The first subscriber triggers the single network request, and the response is shared with all other subscribers.'
      },
      {
        id: 'q4',
        question: 'What does the bufferSize option in shareReplay control?',
        options: [
          { id: 'a', text: 'The network socket buffer size in kilobytes' },
          { id: 'b', text: 'The maximum number of historical emissions recorded and replayed to new subscribers' },
          { id: 'c', text: 'The number of subscribers allowed to connect' },
          { id: 'd', text: 'The timeout in milliseconds before retrying' }
        ],
        correctOptionId: 'b',
        explanation:
          'bufferSize designates how many previous emissions are retained in the replay buffer to be delivered immediately to subsequent late subscribers.'
      }
    ],
    demo: {
      type: 'multicasting',
      title: 'Multicast Network Traffic & Cache Efficiency Chamber',
      description: 'Observe backend request counts and bandwidth efficiency in Unicast vs Multicast (shareReplay) modes as components mount and unmount.'
    }
  }
};
