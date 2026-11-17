import { CatalogProduct, MetricCardConfig, MiniProjectTopicConfig } from './module8.models';

export const CATALOG_PRODUCTS: CatalogProduct[] = [
  {
    id: 1,
    name: 'RxJS Masterclass: Reactive Thinking',
    category: 'Course',
    price: 79,
    originalPrice: 120,
    rating: 4.9,
    badge: 'Bestseller',
    icon: '⚡',
    description: 'Comprehensive deep dive into Observables, operators, multicasting, and marble testing.'
  },
  {
    id: 2,
    name: 'Observables In Depth & Architecture',
    category: 'Course',
    price: 49,
    originalPrice: 80,
    rating: 4.8,
    badge: 'Popular',
    icon: '🔮',
    description: 'Master cold vs hot streams, subscription lifecycles, and memory leak prevention.'
  },
  {
    id: 3,
    name: 'Reactive Patterns & Architecture Handbook',
    category: 'E-Book',
    price: 99,
    originalPrice: 140,
    rating: 5.0,
    badge: 'Premium',
    icon: '📚',
    description: 'Production architecture blueprints: state management, optimistic UI, and cache invalidation.'
  },
  {
    id: 4,
    name: 'RxJS Testing Suite & Virtual Time',
    category: 'Workshop',
    price: 39,
    originalPrice: 60,
    rating: 4.7,
    icon: '🧪',
    description: 'Hands-on guide to TestScheduler, marble testing strings, and deterministic timing.'
  }
];

export const VALID_COUPONS: Record<string, number> = {
  RXJS20: 0.20,
  DEV50: 0.50,
  REACTIVE10: 0.10
};

export const METRIC_CONFIGS: MetricCardConfig[] = [
  {
    id: 'cpu',
    title: 'Processor Load',
    unit: '%',
    icon: '⚙️',
    warningThreshold: 60,
    criticalThreshold: 75
  },
  {
    id: 'mem',
    title: 'Memory Utilization',
    unit: '%',
    icon: '🧠',
    warningThreshold: 70,
    criticalThreshold: 85
  },
  {
    id: 'net',
    title: 'Network Bandwidth',
    unit: 'MB/s',
    icon: '🌐',
    warningThreshold: 400,
    criticalThreshold: 800
  }
];

export const MODULE8_PROJECTS: Record<string, MiniProjectTopicConfig> = {
  'search-autocomplete': {
    id: 'search-autocomplete',
    title: '1. Search Autocomplete',
    subtitle: 'Debounced typeahead search hitting Express REST API with race condition cancellation',
    category: 'Mini-Projects',
    difficulty: 'intermediate',
    conceptSummary:
      'Search autocomplete demonstrates real-world reactive input streams. By piping user keystrokes through debounceTime, distinctUntilChanged, and switchMap, we prevent spamming the backend, eliminate race conditions, and gracefully handle network failures without breaking the subscriber.',
    conceptPillars: [
      {
        title: 'Debouncing Rapid Input',
        description: 'debounceTime(300) buffers keystrokes and waits for a quiet window, preventing wasteful HTTP calls for every keystroke.'
      },
      {
        title: 'Automatic Request Cancellation',
        description: 'switchMap unsubscribes from the in-flight HTTP request whenever a new search query arrives, avoiding out-of-order race conditions.'
      },
      {
        title: 'Error Isolation',
        description: 'Placing catchError inside the inner switchMap observable ensures the outer typeahead stream never dies upon backend 500 errors.'
      }
    ],
    conceptSections: [
      {
        title: 'Why Promises Fail in Typeahead',
        content: 'With standard async/await or Promises, if search query "A" takes 800ms and search query "AB" takes 150ms, query "A" will resolve after "AB", overwriting the newer results with stale data. switchMap cancels earlier in-flight HTTP requests automatically.'
      },
      {
        title: 'Trimming & Distinct Discard',
        content: 'map(term => term.trim()) ensures whitespace padding is removed. distinctUntilChanged() suppresses identical successive searches (such as pressing modifier keys or typing spaces).'
      }
    ],
    takeaways: [
      'Always catch errors inside switchMap inner observables to keep the user input stream alive.',
      'Check for empty queries before dispatching to return of({ lessons: [] }) without hitting the network.',
      'Encode special characters with encodeURIComponent to prevent malformed query parameters.'
    ],
    codeTitle: 'Reactive Search Autocomplete Pipeline',
    codeSnippet: `// Search Autocomplete Pipeline
this.searchControl.valueChanges.pipe(
  map(query => (query ?? '').trim()),
  debounceTime(300),
  distinctUntilChanged(),
  tap(() => this.loading.set(true)),
  switchMap(term => {
    if (!term) {
      return of({ lessons: [], total: 0 });
    }
    return this.lessonsService.searchLessons(term, undefined, 0, 10).pipe(
      catchError(err => {
        this.errorMessage.set('Search service temporarily unavailable.');
        return of({ lessons: [], total: 0 });
      })
    );
  }),
  tap(() => this.loading.set(false)),
  takeUntilDestroyed(this.destroyRef)
).subscribe(response => {
  this.results.set(response.lessons.slice(0, 10));
  this.totalCount.set(response.total);
});`,
    comparisonData: {
      features: [
        { id: 'cancellation', label: 'In-flight Cancellation' },
        { id: 'order', label: 'Order Guarantee' },
        { id: 'debounce', label: 'Built-in Debouncing' },
        { id: 'error_resilience', label: 'Stream Survives Error' }
      ],
      items: [
        {
          id: 'switchmap',
          name: 'switchMap (RxJS)',
          badge: 'Recommended',
          recommendedUse: 'Typeahead search, tab navigation, cancellation-heavy streams',
          characteristics: {
            cancellation: { text: 'Automatic cancellation on new emission', status: 'positive' },
            order: { text: 'Guaranteed latest response only', status: 'positive' },
            debounce: { text: 'Seamlessly piped with debounceTime', status: 'positive' },
            error_resilience: { text: 'Yes, with inner catchError', status: 'positive' }
          }
        },
        {
          id: 'promises',
          name: 'Async / Await (Promises)',
          badge: 'High Pitfall',
          recommendedUse: 'One-off non-cancellable API calls',
          characteristics: {
            cancellation: { text: 'Requires manual AbortController wiring', status: 'negative' },
            order: { text: 'Vulnerable to out-of-order race conditions', status: 'negative' },
            debounce: { text: 'Requires custom setTimeout timer tracking', status: 'negative' },
            error_resilience: { text: 'Requires try/catch block', status: 'neutral' }
          }
        },
        {
          id: 'mergemap',
          name: 'mergeMap (RxJS)',
          recommendedUse: 'Parallel uploads, independent fetches',
          characteristics: {
            cancellation: { text: 'No cancellation (all run concurrently)', status: 'negative' },
            order: { text: 'Fastest finishes first (out of order)', status: 'negative' },
            debounce: { text: 'Supported via pipe', status: 'positive' },
            error_resilience: { text: 'Yes, with inner catchError', status: 'positive' }
          }
        }
      ]
    },
    quizQuestions: [
      {
        id: 'q1-search-switchmap',
        question: 'Why is switchMap preferred over mergeMap for live search autocomplete?',
        options: [
          { id: 'a', text: 'switchMap executes requests in parallel, speeding up network responses.' },
          { id: 'b', text: 'switchMap automatically cancels the in-flight HTTP request when a new search term arrives.' },
          { id: 'c', text: 'switchMap caches previous query results indefinitely.' },
          { id: 'd', text: 'switchMap converts synchronous errors into complete notifications.' }
        ],
        correctOptionId: 'b',
        explanation: 'switchMap cancels the prior active inner subscription when a new query arrives, avoiding stale responses overwriting newer data.'
      },
      {
        id: 'q2-search-catcherror',
        question: 'What happens if catchError is placed on the outer pipe rather than inside the switchMap projection?',
        options: [
          { id: 'a', text: 'The error is automatically retried 3 times.' },
          { id: 'b', text: 'The outer stream terminates permanently, breaking future keystroke responses.' },
          { id: 'c', text: 'The browser triggers a hard refresh.' },
          { id: 'd', text: 'The debounceTime interval is doubled.' }
        ],
        correctOptionId: 'b',
        explanation: 'Catching an error in the outer observable completes the stream, stopping it from listening to subsequent user keystrokes.'
      },
      {
        id: 'q3-search-distinct',
        question: 'What is the primary function of distinctUntilChanged() in a search typeahead pipeline?',
        options: [
          { id: 'a', text: 'It enforces a 300ms pause between events.' },
          { id: 'b', text: 'It discards query strings that are identical to the immediately preceding emission.' },
          { id: 'c', text: 'It converts strings to uppercase before sending.' },
          { id: 'd', text: 'It limits the result set to 10 items.' }
        ],
        correctOptionId: 'b',
        explanation: 'distinctUntilChanged() suppresses duplicate consecutive values, such as when a user types a space and then deletes it, or presses arrow keys.'
      }
    ]
  },

  'live-dashboard': {
    id: 'live-dashboard',
    title: '2. Live Telemetry Dashboard',
    subtitle: 'Real-time multi-variable system monitor with combineLatest, sliding scan buffer, and alerts',
    category: 'Mini-Projects',
    difficulty: 'intermediate',
    conceptSummary:
      'The Live Telemetry Dashboard coordinates multiple independent real-time metric streams (CPU, Memory, Network) into a single unified telemetry point using combineLatest. A sliding 15-point historical buffer is maintained using scan, while real-time threshold evaluators trigger visual alert states.',
    conceptPillars: [
      {
        title: 'Multi-Stream Aggregation',
        description: 'combineLatest([cpu$, mem$, net$]) emits whenever any individual metric updates, providing a cohesive composite telemetry snapshot.'
      },
      {
        title: 'Sliding Window Buffer',
        description: 'scan((history, point) => [...history.slice(-14), point], []) guarantees an exact 15-point sparkline history buffer without unbounded memory growth.'
      },
      {
        title: 'Play/Pause Stream Gating',
        description: 'switchMap(playing => playing ? tick$ : EMPTY) cleanly halts stream generation when paused without losing subscriber bindings.'
      }
    ],
    conceptSections: [
      {
        title: 'Data Sanitization & Boundary Clamping',
        content: 'Raw sensor or network telemetry may contain NaN values or spikes beyond physical limits. All metric inputs are sanitized to ensure NaN defaults to 0 and values are clamped strictly between 0% and 100%.'
      },
      {
        title: 'Dynamic Alert Thresholds',
        content: 'Alert statuses (NORMAL, CRITICAL_CPU > 75%, CRITICAL_MEM > 85%) are computed reactively on every aggregate emission, dynamically triggering high-contrast warning badges.'
      }
    ],
    takeaways: [
      'combineLatest requires every source observable to emit at least once before producing its first emission.',
      'Use scan with immutable array slicing to maintain bounded sliding buffers.',
      'Use switchMap with EMPTY to pause and resume timer streams deterministically.'
    ],
    codeTitle: 'Telemetry Aggregation & Sliding Window Pipeline',
    codeSnippet: `// 1. Play/Pause Controlled Ticker
const activeTicker$ = this.isPlaying$.pipe(
  switchMap(playing => playing ? interval(this.speedMs) : EMPTY)
);

// 2. Aggregate CPU, Mem, Net with combineLatest
const telemetryPoint$ = activeTicker$.pipe(
  withLatestFrom(this.cpu$, this.mem$, this.net$),
  map(([_, rawCpu, rawMem, rawNet]) => {
    const cpu = sanitizeMetric(rawCpu);
    const mem = sanitizeMetric(rawMem);
    const net = Math.max(0, rawNet);
    const alertStatus = evaluateAlert(cpu, mem);
    return { cpu, mem, net, alertStatus, timestamp: new Date().toISOString() };
  })
);

// 3. Sliding 15-point window via scan
telemetryPoint$.pipe(
  scan((history, point) => [...history.slice(-14), point], []),
  takeUntilDestroyed(this.destroyRef)
).subscribe(history => this.historySignal.set(history));`,
    comparisonData: {
      features: [
        { id: 'emission_trigger', label: 'Emission Trigger' },
        { id: 'memory_usage', label: 'Memory Footprint' },
        { id: 'state_accumulation', label: 'State Accumulation' },
        { id: 'gating', label: 'Stream Gating' }
      ],
      items: [
        {
          id: 'combinelatest_scan',
          name: 'combineLatest + scan',
          badge: 'Recommended',
          recommendedUse: 'Real-time telemetry, IoT dashboards, bounded time-series charts',
          characteristics: {
            emission_trigger: { text: 'Emits whenever ANY metric changes', status: 'positive' },
            memory_usage: { text: 'Constant O(15) memory via sliding scan', status: 'positive' },
            state_accumulation: { text: 'Built-in incremental state reduction', status: 'positive' },
            gating: { text: 'Trivially gated with switchMap(isPlaying)', status: 'positive' }
          }
        },
        {
          id: 'zip',
          name: 'zip',
          recommendedUse: 'Step-by-step lockstep pairs',
          characteristics: {
            emission_trigger: { text: 'Waits for EVERY stream to emit N-th item', status: 'negative' },
            memory_usage: { text: 'Can leak memory if one stream emits faster', status: 'negative' },
            state_accumulation: { text: 'Requires separate reducer', status: 'neutral' },
            gating: { text: 'Requires buffer clearing', status: 'neutral' }
          }
        },
        {
          id: 'forkjoin',
          name: 'forkJoin',
          recommendedUse: 'Parallel HTTP requests completing once',
          characteristics: {
            emission_trigger: { text: 'Emits ONCE upon all streams completing', status: 'negative' },
            memory_usage: { text: 'Minimal for one-shot requests', status: 'positive' },
            state_accumulation: { text: 'Not applicable for continuous streaming', status: 'negative' },
            gating: { text: 'Not applicable', status: 'neutral' }
          }
        }
      ]
    },
    quizQuestions: [
      {
        id: 'q1-dashboard-combinelatest',
        question: 'What prerequisite must be satisfied before combineLatest emits its very first value?',
        options: [
          { id: 'a', text: 'All input observables must complete.' },
          { id: 'b', text: 'At least one input observable must emit a value.' },
          { id: 'c', text: 'Every input observable must have emitted at least once.' },
          { id: 'd', text: 'The timer interval must exceed 1000ms.' }
        ],
        correctOptionId: 'c',
        explanation: 'combineLatest cannot assemble a complete array until every source stream provides at least one initial emission.'
      },
      {
        id: 'q2-dashboard-scan-window',
        question: 'How does [...history.slice(-14), point] maintain a 15-item sliding buffer?',
        options: [
          { id: 'a', text: 'It keeps the last 14 items and appends the new point, totaling at most 15 items.' },
          { id: 'b', text: 'It reverses the array order.' },
          { id: 'c', text: 'It clears the array every 14 emissions.' },
          { id: 'd', text: 'It filters out duplicate timestamp points.' }
        ],
        correctOptionId: 'a',
        explanation: 'slice(-14) extracts at most the last 14 items. Appending point results in a maximum array length of 15.'
      },
      {
        id: 'q3-dashboard-pause',
        question: 'Which operator pattern allows pausing and resuming an interval stream reactively?',
        options: [
          { id: 'a', text: 'isPlaying$.pipe(map(p => p ? 1 : 0))' },
          { id: 'b', text: 'isPlaying$.pipe(switchMap(playing => playing ? interval$ : EMPTY))' },
          { id: 'c', text: 'interval$.pipe(takeWhile(() => isPlaying))' },
          { id: 'd', text: 'interval$.pipe(retry(3))' }
        ],
        correctOptionId: 'b',
        explanation: 'switchMap switching to EMPTY completes the inner timer upon pause; switching back to interval$ starts a fresh timer upon resume.'
      }
    ]
  },

  'shopping-cart': {
    id: 'shopping-cart',
    title: '3. Reactive Shopping Cart',
    subtitle: 'Redux-style state management with BehaviorSubject actions, scan reducer, and dynamic promo codes',
    category: 'Mini-Projects',
    difficulty: 'intermediate',
    conceptSummary:
      'The Reactive Shopping Cart demonstrates unidirectional data flow in RxJS. User interactions dispatch discrete actions (ADD, REMOVE, UPDATE_QTY, CLEAR) into a Subject. An immutable scan reducer manages items state, while combineLatest recalculates subtotal, discount, tax, and grand total with float rounding protection.',
    conceptPillars: [
      {
        title: 'Action Stream Reducer',
        description: 'action$.pipe(scan(cartReducer, [])) handles state updates immutably, ensuring single-source-of-truth semantics.'
      },
      {
        title: 'Coupon & Totals Combination',
        description: 'combineLatest([items$, coupon$]) recalculates subtotal, discounts (RXJS20=20%, DEV50=50%), 8% tax, and total whenever items or promo codes change.'
      },
      {
        title: 'Float Arithmetic Precision',
        description: 'Math.round(val * 100) / 100 protects against JavaScript IEEE 754 binary floating point precision errors (e.g. 0.1 + 0.2).'
      }
    ],
    conceptSections: [
      {
        title: 'Quantity Clamping & Edge Protection',
        content: 'When adjusting item quantities, the reducer strictly enforces qty >= 1. Removing a non-existent product ID is safely ignored without altering existing cart state.'
      },
      {
        title: 'Dynamic Discount Engine',
        content: 'Valid promo codes apply percentage deductions to the subtotal before tax calculation. Invalid or expired promo codes evaluate to 0% discount without throwing errors.'
      }
    ],
    takeaways: [
      'Reducers must be pure functions that return new immutable arrays or objects.',
      'Always sanitize and clamp quantities to prevent zero or negative order values.',
      'Use combineLatest to merge cart contents with volatile external state like currency or coupons.'
    ],
    codeTitle: 'Shopping Cart Reducer & Calculation Pipeline',
    codeSnippet: `// 1. Immutable Reducer
function cartReducer(items: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'ADD': {
      const existing = items.find(i => i.id === action.item.id);
      if (existing) {
        return items.map(i => i.id === action.item.id ? { ...i, qty: i.qty + (action.qty ?? 1) } : i);
      }
      return [...items, { ...action.item, qty: Math.max(1, action.qty ?? 1) }];
    }
    case 'REMOVE':
      return items.filter(i => i.id !== action.id);
    case 'UPDATE_QTY':
      return items.map(i => i.id === action.id ? { ...i, qty: Math.max(1, action.qty) } : i);
    case 'CLEAR':
      return [];
    default:
      return items;
  }
}

// 2. Reactive Totals Calculation
combineLatest([this.cartItems$, this.coupon$]).pipe(
  map(([items, coupon]) => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discountRate = VALID_COUPONS[coupon.toUpperCase()] ?? 0;
    const discount = Math.round(subtotal * discountRate * 100) / 100;
    const tax = Math.round((subtotal - discount) * 0.08 * 100) / 100;
    const total = Math.round((subtotal - discount + tax) * 100) / 100;
    return { subtotal, discountRate, discount, tax, total, appliedCoupon: discountRate > 0 ? coupon : null, itemCount: items.reduce((c, i) => c + i.qty, 0) };
  })
);`,
    comparisonData: {
      features: [
        { id: 'unidirectional', label: 'Unidirectional Data Flow' },
        { id: 'boilerplate', label: 'Boilerplate Overhead' },
        { id: 'dev_tools', label: 'DevTools Inspection' },
        { id: 'reactivity', label: 'Reactivity with Signals' }
      ],
      items: [
        {
          id: 'rxjs_scan',
          name: 'RxJS Action Subject + scan',
          badge: 'Lightweight & Direct',
          recommendedUse: 'Feature stores, shopping carts, localized component state',
          characteristics: {
            unidirectional: { text: 'Strict unidirectional action dispatch', status: 'positive' },
            boilerplate: { text: 'Zero external dependencies or boilerplate', status: 'positive' },
            dev_tools: { text: 'Inspectable via tap() or OutputConsole', status: 'neutral' },
            reactivity: { text: 'Easily converted with toSignal()', status: 'positive' }
          }
        },
        {
          id: 'ngrx_store',
          name: 'NgRx Global Store',
          recommendedUse: 'Large enterprise apps with shared cross-domain state',
          characteristics: {
            unidirectional: { text: 'Strict Redux pattern enforcement', status: 'positive' },
            boilerplate: { text: 'Requires actions, reducers, selectors, effects', status: 'negative' },
            dev_tools: { text: 'Redux DevTools time-travel debugging', status: 'positive' },
            reactivity: { text: 'store.selectSignal() built-in', status: 'positive' }
          }
        },
        {
          id: 'signal_store',
          name: 'Angular Signals Service',
          recommendedUse: 'Local component state without complex stream merging',
          characteristics: {
            unidirectional: { text: 'Manual method calls (update/set)', status: 'neutral' },
            boilerplate: { text: 'Minimal boilerplate', status: 'positive' },
            dev_tools: { text: 'Standard Angular DevTools', status: 'neutral' },
            reactivity: { text: 'Pure signals, requires rxjs-interop for streams', status: 'neutral' }
          }
        }
      ]
    },
    quizQuestions: [
      {
        id: 'q1-cart-scan',
        question: 'Why is scan() ideal for managing shopping cart items?',
        options: [
          { id: 'a', text: 'It caches HTTP GET requests indefinitely.' },
          { id: 'b', text: 'It accumulates actions over time, emitting the updated state after each action.' },
          { id: 'c', text: 'It converts arrays into promises.' },
          { id: 'd', text: 'It limits the cart to 10 items.' }
        ],
        correctOptionId: 'b',
        explanation: 'Like Array.prototype.reduce, scan accumulates values; unlike reduce, it emits every intermediate state immediately.'
      },
      {
        id: 'q2-cart-float',
        question: 'Why should money calculations in JavaScript use Math.round(val * 100) / 100?',
        options: [
          { id: 'a', text: 'To convert strings to numbers.' },
          { id: 'b', text: 'To avoid binary floating-point representation errors like 0.1 + 0.2 = 0.30000000000000004.' },
          { id: 'c', text: 'To round down to the nearest integer.' },
          { id: 'd', text: 'To prevent division by zero.' }
        ],
        correctOptionId: 'b',
        explanation: 'JavaScript numbers are 64-bit IEEE 754 floats. Multiplying by 100, rounding, and dividing by 100 guarantees clean cent-accurate decimals.'
      },
      {
        id: 'q3-cart-clamp',
        question: 'What is the purpose of Math.max(1, action.qty) in the UPDATE_QTY action?',
        options: [
          { id: 'a', text: 'To enforce a maximum order quantity of 1.' },
          { id: 'b', text: 'To prevent negative or zero quantities from corrupting order totals.' },
          { id: 'c', text: 'To auto-apply coupon discounts.' },
          { id: 'd', text: 'To delete the item when quantity reaches zero.' }
        ],
        correctOptionId: 'b',
        explanation: 'Clamping with Math.max(1, qty) prevents invalid zero or negative quantities, ensuring users must explicitly use REMOVE.'
      }
    ]
  },

  'http-manager': {
    id: 'http-manager',
    title: '4. HTTP Request Manager',
    subtitle: 'Direct 4-way benchmark of switchMap, concatMap, mergeMap, and exhaustMap on Express slow APIs',
    category: 'Mini-Projects',
    difficulty: 'advanced',
    conceptSummary:
      'The HTTP Request Manager demonstrates the behavioral differences between all four flattening operators on the exact same scenario. By triggering rapid burst requests against Express /api/slow, it visualizes the 5 lifecycle states (QUEUED, ACTIVE, COMPLETED, CANCELLED, IGNORED) and performance metrics.',
    conceptPillars: [
      {
        title: 'switchMap: Cancellation',
        description: 'Cancels prior active requests when a new trigger arrives. Only the final request completes.'
      },
      {
        title: 'concatMap: Sequential FIFO',
        description: 'Queues requests and processes them sequentially one-by-one. Guarantees ordering at the cost of total latency.'
      },
      {
        title: 'mergeMap: Concurrent Parallel',
        description: 'Executes all requests in parallel immediately. Order of completion depends on individual server response speed.'
      },
      {
        title: 'exhaustMap: Busy Lockout',
        description: 'Accepts the first trigger and ignores all subsequent triggers while the first request is active.'
      }
    ],
    conceptSections: [
      {
        title: 'The 5 Request Lifecycle States',
        content: 'Each request transitions through distinct states: IDLE -> QUEUED (concatMap waiting in line) -> ACTIVE (in-flight HTTP) -> COMPLETED (200 OK) or CANCELLED (switchMap abort) or IGNORED (exhaustMap lockout).'
      },
      {
        title: 'Real Express Server Integration',
        content: 'Requests target GET /api/slow?delay=... with configurable response latency, verifying real-world HTTP client behavior.'
      }
    ],
    takeaways: [
      'Use switchMap for search and navigation where stale requests must be discarded.',
      'Use concatMap for state-modifying database writes where sequence matters.',
      'Use mergeMap for independent parallel reads or file chunk uploads.',
      'Use exhaustMap for login buttons, payment submissions, and refresh clicks.'
    ],
    codeTitle: '4 Flattening Strategies Benchmark Harness',
    codeSnippet: `// 1. switchMap: Cancels older in-flight requests
trigger$.pipe(
  switchMap(req => this.http.get('/api/slow?delay=' + req.delay))
);

// 2. concatMap: Sequential FIFO execution
trigger$.pipe(
  concatMap(req => this.http.get('/api/slow?delay=' + req.delay))
);

// 3. mergeMap: Concurrent parallel execution
trigger$.pipe(
  mergeMap(req => this.http.get('/api/slow?delay=' + req.delay))
);

// 4. exhaustMap: Ignores new triggers while busy
trigger$.pipe(
  exhaustMap(req => this.http.get('/api/slow?delay=' + req.delay))
);`,
    comparisonData: {
      features: [
        { id: 'concurrency', label: 'Concurrency' },
        { id: 'cancellation', label: 'Cancels In-Flight' },
        { id: 'ordering', label: 'Order Preserved' },
        { id: 'best_for', label: 'Primary Use Case' }
      ],
      items: [
        {
          id: 'switchmap',
          name: 'switchMap',
          badge: 'Most Popular',
          recommendedUse: 'Typeahead, route changes, live polling refresh',
          characteristics: {
            concurrency: { text: '1 active (cancels previous)', status: 'positive' },
            cancellation: { text: 'Yes, immediate abort', status: 'positive' },
            ordering: { text: 'Only latest survives', status: 'neutral' },
            best_for: { text: 'Read operations where only latest counts', status: 'positive' }
          }
        },
        {
          id: 'concatmap',
          name: 'concatMap',
          recommendedUse: 'Save operations, ordered messaging queues',
          characteristics: {
            concurrency: { text: '1 at a time (strict FIFO queue)', status: 'neutral' },
            cancellation: { text: 'No cancellation', status: 'negative' },
            ordering: { text: 'Strict emission order preserved', status: 'positive' },
            best_for: { text: 'Mutating writes requiring sequence', status: 'positive' }
          }
        },
        {
          id: 'mergemap',
          name: 'mergeMap',
          recommendedUse: 'Parallel image uploads, independent feeds',
          characteristics: {
            concurrency: { text: 'Unlimited / Configurable', status: 'positive' },
            cancellation: { text: 'No cancellation', status: 'negative' },
            ordering: { text: 'Order based on latency (out-of-order)', status: 'negative' },
            best_for: { text: 'High-throughput independent fetches', status: 'positive' }
          }
        },
        {
          id: 'exhaustmap',
          name: 'exhaustMap',
          badge: 'Submission Guard',
          recommendedUse: 'Login buttons, payment submissions, modal triggers',
          characteristics: {
            concurrency: { text: '1 active (drops subsequent)', status: 'positive' },
            cancellation: { text: 'No (locks out new)', status: 'positive' },
            ordering: { text: 'First-come, first-served', status: 'neutral' },
            best_for: { text: 'Preventing double-submit spam', status: 'positive' }
          }
        }
      ]
    },
    quizQuestions: [
      {
        id: 'q1-http-exhaustmap',
        question: 'Which operator should you use to prevent duplicate payment submissions if a user double-clicks "Pay Now"?',
        options: [
          { id: 'a', text: 'switchMap' },
          { id: 'b', text: 'mergeMap' },
          { id: 'c', text: 'concatMap' },
          { id: 'd', text: 'exhaustMap' }
        ],
        correctOptionId: 'd',
        explanation: 'exhaustMap ignores all clicks while the first payment request is pending, preventing duplicate charges.'
      },
      {
        id: 'q2-http-concatmap',
        question: 'What is the main drawback of using concatMap for multiple network calls?',
        options: [
          { id: 'a', text: 'It cancels slower requests.' },
          { id: 'b', text: 'Total elapsed time is the sum of all individual request latencies because they execute sequentially.' },
          { id: 'c', text: 'It ignores requests when busy.' },
          { id: 'd', text: 'It produces unhandled errors.' }
        ],
        correctOptionId: 'b',
        explanation: 'concatMap waits for each inner observable to complete before starting the next, accumulating latencies in series.'
      },
      {
        id: 'q3-http-mergemap',
        question: 'In what order do emissions resolve when using mergeMap with variable latencies?',
        options: [
          { id: 'a', text: 'Strictly in the order they were triggered.' },
          { id: 'b', text: 'In reverse order of trigger.' },
          { id: 'c', text: 'In whatever order the server finishes responding (fastest first).' },
          { id: 'd', text: 'Only the last trigger resolves.' }
        ],
        correctOptionId: 'c',
        explanation: 'mergeMap runs inner observables concurrently, so faster network responses emit before slower ones regardless of trigger order.'
      }
    ]
  },

  'polling-system': {
    id: 'polling-system',
    title: '5. Polling & Tab Suspension',
    subtitle: 'Adaptive polling loop with tab visibility auto-pause, exponential backoff, and debounced manual refresh',
    category: 'Mini-Projects',
    difficulty: 'advanced',
    conceptSummary:
      'The Polling System implements a resilient, battery-friendly polling engine. It periodically queries the backend with timer(0, intervalMs), pauses automatically when the user switches browser tabs via document visibilitychange, recovers from transient failures with exponential backoff, and supports debounced manual refreshes.',
    conceptPillars: [
      {
        title: 'Visibility-Aware Suspension',
        description: 'fromEvent(document, "visibilitychange") switches between active polling and EMPTY, saving battery and server bandwidth when the tab is hidden.'
      },
      {
        title: 'Exponential Backoff Retry',
        description: 'retry({ delay: (err, retryCount) => timer(Math.min(1000 * 2 ** (retryCount - 1), 8000)) }) allows recovering gracefully from temporary server blips.'
      },
      {
        title: 'Debounced Manual Fetch',
        description: 'merge(periodicTimer$, manualRefresh$.pipe(debounceTime(10))) provides instantaneous user-initiated refresh without firing duplicate queries.'
      }
    ],
    conceptSections: [
      {
        title: 'Interval Clamping & Safety',
        content: 'To prevent accidental 0ms or negative interval tight loops that lock the browser event loop, polling intervals are clamped to a minimum safe threshold of 500ms.'
      },
      {
        title: 'Clean Stream Teardown',
        content: 'takeUntil(this.stop$) cleanly cancels any pending timer and in-flight HTTP request when polling is stopped or the component is destroyed.'
      }
    ],
    takeaways: [
      'Always suspend background polling when document.hidden is true to conserve battery and data.',
      'Clamp polling intervals to a minimum of 500ms to protect the server and client UI.',
      'Use exponential backoff retry to handle intermittent network disconnections gracefully.'
    ],
    codeTitle: 'Visibility-Aware Polling Pipeline with Backoff',
    codeSnippet: `// 1. Tab Visibility Stream
const isVisible$ = fromEvent(document, 'visibilitychange').pipe(
  map(() => document.visibilityState === 'visible'),
  startWith(!document.hidden)
);

// 2. Periodic Timer + Manual Refresh Stream
const trigger$ = isVisible$.pipe(
  switchMap(visible => {
    if (!visible) return EMPTY; // Suspend polling when tab hidden
    const intervalClamped = Math.max(500, this.intervalMs);
    const periodic$ = timer(0, intervalClamped);
    const manual$ = this.manualRefresh$.pipe(debounceTime(10));
    return merge(periodic$, manual$);
  })
);

// 3. Resilient Fetch Pipeline with Exponential Backoff
trigger$.pipe(
  switchMap(() => this.lessonsService.searchLessons('', undefined, 0, 5).pipe(
    retry({
      count: 2,
      delay: (err, retryCount) => timer(Math.min(500 * Math.pow(2, retryCount - 1), 4000))
    }),
    catchError(err => of({ lessons: [], total: 0, status: 'offline' }))
  )),
  takeUntil(this.stop$),
  takeUntilDestroyed(this.destroyRef)
).subscribe(result => this.handlePollResult(result));`,
    comparisonData: {
      features: [
        { id: 'server_push', label: 'True Server Push' },
        { id: 'battery_impact', label: 'Battery Impact' },
        { id: 'implementation', label: 'Infrastructure Complexity' },
        { id: 'firewall_compat', label: 'Firewall & Proxy Friendly' }
      ],
      items: [
        {
          id: 'smart_polling',
          name: 'Smart Polling (RxJS)',
          badge: 'Simple & Robust',
          recommendedUse: 'Dashboards, status checks, low-frequency updates',
          characteristics: {
            server_push: { text: 'No (client pull model)', status: 'negative' },
            battery_impact: { text: 'Low when gated by visibilitychange', status: 'positive' },
            implementation: { text: 'Standard HTTP REST endpoints', status: 'positive' },
            firewall_compat: { text: '100% compatible with all proxies & CDNs', status: 'positive' }
          }
        },
        {
          id: 'websockets',
          name: 'WebSockets',
          badge: 'Real-Time',
          recommendedUse: 'Chat, multiplayer games, high-frequency stock tickers',
          characteristics: {
            server_push: { text: 'Yes, full-duplex persistent connection', status: 'positive' },
            battery_impact: { text: 'Moderate (keeps socket open)', status: 'neutral' },
            implementation: { text: 'Requires stateful WS server cluster', status: 'negative' },
            firewall_compat: { text: 'May be blocked by enterprise firewalls', status: 'neutral' }
          }
        },
        {
          id: 'sse',
          name: 'Server-Sent Events (SSE)',
          recommendedUse: 'One-way notifications, live log feeds',
          characteristics: {
            server_push: { text: 'Yes, one-way server-to-client', status: 'positive' },
            battery_impact: { text: 'Low (HTTP streaming)', status: 'positive' },
            implementation: { text: 'Simple HTTP endpoint with text/event-stream', status: 'positive' },
            firewall_compat: { text: 'Good (runs over standard HTTP/2)', status: 'positive' }
          }
        }
      ]
    },
    quizQuestions: [
      {
        id: 'q1-polling-visibility',
        question: 'Why should background polling be suspended when document.hidden is true?',
        options: [
          { id: 'a', text: 'To prevent DOM memory leaks.' },
          { id: 'b', text: 'To save device battery, client CPU, and unnecessary server load.' },
          { id: 'c', text: 'Because JavaScript execution is prohibited in hidden tabs.' },
          { id: 'd', text: 'To force the browser to trigger garbage collection.' }
        ],
        correctOptionId: 'b',
        explanation: 'Users cannot view hidden tabs, so continuing to make frequent network requests wastes mobile battery and server resources.'
      },
      {
        id: 'q2-polling-backoff',
        question: 'What is the purpose of exponential backoff retry in a polling pipeline?',
        options: [
          { id: 'a', text: 'To cancel previous HTTP queries.' },
          { id: 'b', text: 'To give a struggling backend breathing room by gradually increasing wait times between retries.' },
          { id: 'c', text: 'To immediately terminate the observable on error.' },
          { id: 'd', text: 'To encrypt HTTP payloads.' }
        ],
        correctOptionId: 'b',
        explanation: 'Exponential backoff prevents hammering an already overloaded server, exponentially spacing out subsequent retry attempts.'
      },
      {
        id: 'q3-polling-manual',
        question: 'Why should manual refresh clicks be debounced when combined with periodic polling?',
        options: [
          { id: 'a', text: 'To prevent rapid multi-clicking by users from flooding the server with duplicate fetches.' },
          { id: 'b', text: 'To reverse the order of items.' },
          { id: 'c', text: 'To convert HTTP GET requests to POST requests.' },
          { id: 'd', text: 'To clear localStorage cache.' }
        ],
        correctOptionId: 'a',
        explanation: 'Debouncing the manual click stream ensures that double-clicking or rapid clicking produces exactly one fetch.'
      }
    ]
  },

  'multistep-form': {
    id: 'multistep-form',
    title: '6. Multi-Step Form Wizard',
    subtitle: 'Cross-step reactive wizard with debounced draft autosave, role-based topic filtering, and exhaustMap submission',
    category: 'Mini-Projects',
    difficulty: 'advanced',
    conceptSummary:
      'The Multi-Step Form Wizard showcases advanced Reactive Forms state management across steps. Features include debounced draft auto-saving to LocalStorage, corrupted JSON fallback recovery, role-based dynamic field filtering with automatic cleanup on role changes, step navigation clamping [1, 3], and double-submit prevention via exhaustMap.',
    conceptPillars: [
      {
        title: 'Debounced Draft Auto-Save',
        description: 'form.valueChanges.pipe(debounceTime(300)) persists in-progress form drafts to LocalStorage without causing UI lag on every keystroke.'
      },
      {
        title: 'Dynamic Role-Based Dependencies',
        description: 'Changing user roles dynamically adapts available topic interests and resets invalid selections from prior roles.'
      },
      {
        title: 'exhaustMap Submission Guard',
        description: 'Guards final registration submission against double-clicks, locking the submit button until the server responds.'
      }
    ],
    conceptSections: [
      {
        title: 'Step Gating & Validation Rules',
        content: 'Users cannot skip forward to Step 3 without completing Steps 1 and 2. Step navigation is strictly clamped between 1 and 3.'
      },
      {
        title: 'Storage Corruption Resilience',
        content: 'If LocalStorage contains malformed or corrupted JSON from a previous version, the draft loader catches the parsing exception and initializes a clean default state.'
      }
    ],
    takeaways: [
      'Use exhaustMap on final form submission to eliminate race conditions and accidental double submissions.',
      'Auto-save forms with debounceTime to minimize disk I/O while preserving user input across tab closures.',
      'Always sanitize and validate deserialized LocalStorage JSON before feeding it into Reactive Forms.'
    ],
    codeTitle: 'Multi-Step Form Wizard State & Submission Pipeline',
    codeSnippet: `// 1. Debounced Draft Auto-Save with Corrupted JSON Protection
form.valueChanges.pipe(
  debounceTime(300),
  takeUntilDestroyed(this.destroyRef)
).subscribe(draft => {
  try {
    localStorage.setItem('wizard_draft', JSON.stringify(draft));
    this.saveStatus.set('Draft saved');
  } catch {
    this.saveStatus.set('Storage error');
  }
});

// 2. Submit Action with exhaustMap Double-Submit Protection
this.submitAction$.pipe(
  exhaustMap(formData => {
    this.isSubmitting.set(true);
    return this.http.post('/api/registration', formData).pipe(
      catchError(err => of({ status: 'success', simulated: true }))
    );
  }),
  takeUntilDestroyed(this.destroyRef)
).subscribe(response => {
  this.isSubmitting.set(false);
  this.isComplete.set(true);
  localStorage.removeItem('wizard_draft');
});`,
    comparisonData: {
      features: [
        { id: 'draft_retention', label: 'Draft Preservation' },
        { id: 'validation_gating', label: 'Cross-Step Gating' },
        { id: 'double_submit', label: 'Double-Submit Protection' },
        { id: 'dynamic_fields', label: 'Dynamic Field Adaptation' }
      ],
      items: [
        {
          id: 'rxjs_wizard',
          name: 'RxJS Reactive Wizard',
          badge: 'Recommended',
          recommendedUse: 'Complex onboarding, multi-step checkouts, dynamic registrations',
          characteristics: {
            draft_retention: { text: 'Debounced LocalStorage sync with corrupted JSON fallback', status: 'positive' },
            validation_gating: { text: 'Declarative step validation checks', status: 'positive' },
            double_submit: { text: 'exhaustMap locks submission stream', status: 'positive' },
            dynamic_fields: { text: 'Reactive role stream resets invalid options', status: 'positive' }
          }
        },
        {
          id: 'template_driven',
          name: 'Template-Driven Form',
          recommendedUse: 'Simple single-input forms (e.g. login)',
          characteristics: {
            draft_retention: { text: 'Requires manual ngModelChange handlers', status: 'negative' },
            validation_gating: { text: 'Complex template expressions', status: 'negative' },
            double_submit: { text: 'Manual boolean flag management', status: 'neutral' },
            dynamic_fields: { text: 'Prone to ngIf expression errors', status: 'negative' }
          }
        },
        {
          id: 'url_stepper',
          name: 'Route-Based Stepper',
          recommendedUse: 'Wizards where each step has a distinct bookmarkable URL',
          characteristics: {
            draft_retention: { text: 'Requires central state service or URL query params', status: 'neutral' },
            validation_gating: { text: 'Route guards (CanActivate)', status: 'positive' },
            double_submit: { text: 'Manual or service-level guard', status: 'neutral' },
            dynamic_fields: { text: 'Managed per routed component', status: 'neutral' }
          }
        }
      ]
    },
    quizQuestions: [
      {
        id: 'q1-wizard-exhaustmap',
        question: 'Why is exhaustMap preferred over mergeMap for handling form submission?',
        options: [
          { id: 'a', text: 'exhaustMap retries failed submissions 3 times.' },
          { id: 'b', text: 'exhaustMap ignores duplicate clicks while a submission is already in-flight.' },
          { id: 'c', text: 'exhaustMap cancels the previous submission.' },
          { id: 'd', text: 'exhaustMap encrypts the form payload.' }
        ],
        correctOptionId: 'b',
        explanation: 'exhaustMap locks out subsequent emissions until the current inner observable finishes, preventing accidental double-submits.'
      },
      {
        id: 'q2-wizard-draft',
        question: 'Why should form draft auto-saving use debounceTime(300)?',
        options: [
          { id: 'a', text: 'To wait until the user finishes typing before serializing and writing to LocalStorage.' },
          { id: 'b', text: 'To delay form validation.' },
          { id: 'c', text: 'To clear the form after 300ms.' },
          { id: 'd', text: 'To prevent users from navigating backwards.' }
        ],
        correctOptionId: 'a',
        explanation: 'Writing to LocalStorage on every single keystroke causes unnecessary performance overhead; debounceTime waits for a pause in typing.'
      },
      {
        id: 'q3-wizard-role',
        question: 'When a user switches their role from "advanced" to "beginner", what should happen to selected topics?',
        options: [
          { id: 'a', text: 'They should be saved to an external database.' },
          { id: 'b', text: 'They should be reset to empty to prevent incompatible cross-role options from remaining selected.' },
          { id: 'c', text: 'They should remain unchanged.' },
          { id: 'd', text: 'The form should be submitted immediately.' }
        ],
        correctOptionId: 'b',
        explanation: 'Resetting dependent fields when a parent category or role changes prevents invalid stale selections from persisting into the final payload.'
      }
    ]
  }
};
