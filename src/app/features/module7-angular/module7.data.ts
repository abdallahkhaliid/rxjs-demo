import { ComparisonData, QuizQuestion, OperatorMetadata } from '../../core/models';

export interface RecipeTopicData {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  metadata?: OperatorMetadata;
  codeSnippets: Record<string, { title: string; language: string; code: string }>;
}

export const MODULE7_RECIPES: Record<string, RecipeTopicData> = {
  'http-patterns': {
    id: 'http-patterns',
    title: 'HTTP Patterns & Caching',
    subtitle: 'Resilient data fetching with shareReplay, exponential backoff retries, and cancellation',
    category: 'Angular Recipes',
    difficulty: 'intermediate',
    description:
      'Angular HttpClient methods return cold unicast Observables that trigger an independent HTTP request for every subscriber. In production applications, this leads to redundant network traffic, race conditions, and poor performance. By applying shareReplay({ bufferSize: 1, refCount: true }), retry with exponential backoff, and switchMap for refresh triggers, we create robust, cache-efficient HTTP pipelines that gracefully handle transient network errors and client cancellation.',
    codeSnippets: {
      caching: {
        title: 'shareReplay Caching with Teardown',
        language: 'typescript',
        code: `// Caching HTTP responses with shareReplay and refCount
@Injectable({ providedIn: 'root' })
export class CourseService {
  private http = inject(HttpClient);
  private cachedCourse$?: Observable<Course>;

  getCourse(id: number, forceRefresh = false): Observable<Course> {
    if (!this.cachedCourse$ || forceRefresh) {
      this.cachedCourse$ = this.http.get<Course>(\`/api/courses/\${id}\`).pipe(
        // bufferSize: 1 holds the latest emission for late subscribers
        // refCount: true guarantees unsubscription from source when subscribers reach 0
        shareReplay({ bufferSize: 1, refCount: true })
      );
    }
    return this.cachedCourse$;
  }
}`
      },
      retry: {
        title: 'Exponential Backoff Retry with 4xx Discrimination',
        language: 'typescript',
        code: `// Exponential backoff retry policy avoiding 4xx client errors
fetchWithResilientRetry(url: string, maxRetries = 3, baseDelayMs = 500): Observable<any> {
  return this.http.get(url).pipe(
    retry({
      count: maxRetries,
      delay: (err: any, retryCount: number) => {
        // F39.B1: Do NOT retry client errors (400, 401, 403, 404)
        if (err.status >= 400 && err.status < 500) {
          throw err;
        }
        // Exponential backoff: baseDelay * 2^(retryCount - 1)
        const delayMs = Math.pow(2, retryCount - 1) * baseDelayMs;
        return timer(delayMs);
      }
    }),
    catchError(err => of({ fallback: true, error: err.message }))
  );
}`
      },
      refresh: {
        title: 'Refresh Subject with switchMap Cancellation',
        language: 'typescript',
        code: `// Reloading data on demand while cancelling previous in-flight requests
export class CourseListComponent {
  private courseService = inject(CourseService);
  readonly refresh$ = new Subject<void>();

  // startWith(null) triggers the initial fetch automatically
  readonly course$ = this.refresh$.pipe(
    startWith(null),
    switchMap(() => this.courseService.getCourse(1))
  );

  onRefreshClicked(): void {
    this.refresh$.next(); // switchMap cancels prior pending call if still in-flight
  }
}`
      }
    }
  },

  'reactive-forms': {
    id: 'reactive-forms',
    title: 'Reactive Forms with Debounce',
    subtitle: 'Auto-saving forms with valueChanges, debounceTime, distinctUntilChanged, and switchMap',
    category: 'Angular Recipes',
    difficulty: 'intermediate',
    description:
      'Connecting Angular Reactive Forms to auto-save endpoints requires balancing responsiveness with server load. Without debouncing, a 50-keystroke edit fires 50 HTTP requests. By chaining form.valueChanges with debounceTime(400), distinctUntilChanged with a custom JSON comparator, filter(() => form.valid), and switchMap, we build a seamless 5-stage auto-save state machine that eliminates up to 95% of server traffic and automatically cancels outdated in-flight requests.',
    codeSnippets: {
      pipeline: {
        title: 'Auto-Save Pipeline Pipeline',
        language: 'typescript',
        code: `// Complete auto-save reactive pipeline
this.form.valueChanges.pipe(
  takeUntilDestroyed(this.destroyRef),
  tap(() => this.status.set('typing')),
  debounceTime(400),
  // Prevent duplicate saves when user deletes and retypes same value
  distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
  // Only proceed if all validators pass
  filter(() => this.form.valid),
  tap(() => this.status.set('saving')),
  // switchMap cancels prior pending HTTP PUT if new input arrives
  switchMap(payload =>
    this.courseService.saveCourse(this.courseId, payload).pipe(
      catchError(err => {
        this.status.set('error');
        return of(null);
      })
    )
  )
).subscribe(response => {
  if (response) {
    this.status.set('saved');
    this.lastSavedAt.set(Date.now());
  }
});`
      },
      crossField: {
        title: 'Cross-Field Reactive Dependencies',
        language: 'typescript',
        code: `// Field A updates Field B options reactively
readonly categories = ['Frontend', 'Backend', 'DevOps', 'Mobile'];

readonly subCategories$ = this.form.get('category')!.valueChanges.pipe(
  startWith(this.form.get('category')!.value),
  map(category => {
    switch (category) {
      case 'Frontend': return ['Angular', 'React', 'Vue', 'RxJS', 'TypeScript'];
      case 'Backend': return ['Node.js', 'NestJS', 'Express', 'Python', 'Go'];
      case 'DevOps': return ['Docker', 'Kubernetes', 'CI/CD', 'Terraform'];
      case 'Mobile': return ['Ionic', 'React Native', 'Flutter', 'Swift'];
      default: return [];
    }
  }),
  tap(subCats => {
    // Reset subCategory value if current value is not in new list
    const currentSub = this.form.get('subCategory')!.value;
    if (!subCats.includes(currentSub)) {
      this.form.get('subCategory')!.setValue(subCats[0] || '');
    }
  })
);`
      },
      validation: {
        title: 'Nested Form & Custom Validators',
        language: 'typescript',
        code: `// Setup typed FormGroup with nested controls
this.courseForm = this.fb.group({
  title: ['', [Validators.required, Validators.minLength(3)]],
  category: ['Frontend', Validators.required],
  subCategory: ['Angular', Validators.required],
  description: ['', [Validators.required, Validators.maxLength(10000)]],
  difficulty: ['intermediate', Validators.required],
  autoSaveEnabled: [true]
});`
      }
    }
  },

  'lifecycle-teardown': {
    id: 'lifecycle-teardown',
    title: 'Lifecycle & takeUntilDestroyed',
    subtitle: 'Preventing memory leaks and zombie subscriptions using Angular 20 DestroyRef',
    category: 'Angular Recipes',
    difficulty: 'intermediate',
    description:
      'In Single Page Applications, subscriptions to global observables (router events, timers, polling services) outlive component DOM destruction unless explicitly terminated. Lingering listeners keep the entire component instance in JavaScript memory, continuing to trigger callbacks and wasting CPU/RAM. Angular 20 introduces takeUntilDestroyed() and DestroyRef, replacing error-prone ngOnDestroy boilerplate with declarative, injection-aware stream teardown.',
    codeSnippets: {
      modern: {
        title: 'takeUntilDestroyed in Angular 20',
        language: 'typescript',
        code: `// Inside Constructor (Implicit Injection Context)
export class ModernComponent {
  private service = inject(TelemetryService);

  constructor() {
    this.service.data$.pipe(
      takeUntilDestroyed() // Automatically resolves DestroyRef from injection context!
    ).subscribe(data => console.log(data));
  }
}

// Inside Methods or ngOnInit (Explicit DestroyRef)
export class MethodComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private service = inject(TelemetryService);

  ngOnInit() {
    this.service.data$.pipe(
      takeUntilDestroyed(this.destroyRef) // Explicit reference required outside constructor
    ).subscribe(data => console.log(data));
  }
}`
      },
      leaky: {
        title: 'The Unmanaged Subscription Anti-Pattern',
        language: 'typescript',
        code: `// ⚠️ DANGER: Unmanaged Subscription causes Memory Leak!
export class LeakyWidgetComponent implements OnInit {
  private timer$ = interval(1000);

  ngOnInit() {
    // When this component is unmounted from the DOM,
    // this subscription remains alive in memory!
    // The closure holds 'this', preventing garbage collection.
    this.timer$.subscribe(tick => {
      console.log('Zombie tick:', tick);
    });
  }
}`
      },
      legacy: {
        title: 'Legacy takeUntil + Subject Pattern',
        language: 'typescript',
        code: `// Legacy pattern before Angular 16 (Verbose boilerplate)
export class LegacyComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit() {
    interval(1000).pipe(
      takeUntil(this.destroy$)
    ).subscribe(v => console.log(v));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete(); // Must remember to call both!
  }
}`
      }
    }
  },

  'state-management': {
    id: 'state-management',
    title: 'BehaviorSubject State Store',
    subtitle: 'Pragmatic reactive state management with action dispatchers, selectors, and toSignal bridging',
    category: 'Angular Recipes',
    difficulty: 'advanced',
    description:
      'For feature modules and medium-sized applications, heavy external state libraries often add unnecessary overhead. A BehaviorSubject-backed reactive store provides single-source-of-truth state, synchronous snapshot access via getValue(), fine-grained slice selection with distinctUntilChanged memoization, and seamless bridging into Angular 20 zoneless templates using toSignal().',
    codeSnippets: {
      storeService: {
        title: 'Immutable BehaviorSubject Store Pattern',
        language: 'typescript',
        code: `// Generic Immutable Reactive Store Base
export class Store<T> {
  private _state$: BehaviorSubject<T>;
  readonly state$: Observable<T>;

  constructor(initialState: T) {
    this._state$ = new BehaviorSubject<T>(initialState);
    this.state$ = this._state$.asObservable();
  }

  getState(): T {
    return this._state$.getValue();
  }

  select<K>(selector: (state: T) => K): Observable<K> {
    return this.state$.pipe(
      map(selector),
      // Prevent selector emission when unrelated state branches update
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
    );
  }

  update(updater: (state: T) => T): void {
    const nextState = updater(this.getState());
    this._state$.next(nextState); // Immutability preserved
  }
}`
      },
      courseStore: {
        title: 'Domain Course Store Implementation',
        language: 'typescript',
        code: `// Specialized Course State Store
@Injectable({ providedIn: 'root' })
export class CourseStateStoreService {
  private store = new Store<CourseStoreState>(INITIAL_STATE);

  // Memoized Selectors
  readonly courses$ = this.store.select(s => s.courses);
  readonly filterCategory$ = this.store.select(s => s.filterCategory);
  readonly filteredCourses$ = this.store.select(s =>
    s.courses.filter(c => s.filterCategory === 'all' || c.category === s.filterCategory)
  );

  // Action Dispatchers
  setCategoryFilter(category: string): void {
    this.store.update(s => ({ ...s, filterCategory: category }));
  }

  toggleEnrollment(courseId: number): void {
    this.store.update(s => ({
      ...s,
      courses: s.courses.map(c => c.id === courseId ? { ...c, enrolled: !c.enrolled } : c)
    }));
  }
}`
      },
      signalBridge: {
        title: 'Angular 20 toSignal() Bridging',
        language: 'typescript',
        code: `// Bridging Store Observable Selectors to Signals for Zoneless Templates
@Component({
  standalone: true,
  template: \`
    <div class="stats-pill">
      Total: {{ totalCount() }} | Filter: {{ currentFilter() }}
    </div>
    @for (course of filteredCourses(); track course.id) {
      <div class="course-card">{{ course.title }}</div>
    }
  \`
})
export class CourseListComponent {
  private store = inject(CourseStateStoreService);

  // toSignal automatically manages unsubscription on component destruction
  readonly totalCount = toSignal(this.store.select(s => s.courses.length), { initialValue: 0 });
  readonly currentFilter = toSignal(this.store.filterCategory$, { initialValue: 'all' });
  readonly filteredCourses = toSignal(this.store.filteredCourses$, { initialValue: [] });
}`
      }
    }
  }
};

export const MODULE7_COMPARISONS: Record<string, ComparisonData> = {
  'http-patterns': {
    features: [
      { id: 'caching', label: 'Response Caching' },
      { id: 'teardown', label: 'Connection Teardown on Zero Subscribers' },
      { id: 'replay', label: 'Replay to Late Subscribers' },
      { id: 'retry', label: 'Transient Error Resilience' },
      { id: 'recommended', label: 'Best Suited For' }
    ],
    items: [
      {
        id: 'share-replay',
        name: 'shareReplay({ bufferSize: 1, refCount: true })',
        badge: 'Recommended',
        recommendedUse: 'Standard HTTP caching in Angular services',
        characteristics: {
          caching: { text: 'Caches last emission for subsequent subscribers', status: 'positive' },
          teardown: { text: 'Cleanly unsubscribes when subscriber count hits zero (refCount: true)', status: 'positive' },
          replay: { text: 'Replays bufferSize (1) immediately to new subscribers', status: 'positive' },
          retry: { text: 'Combine with retry({ delay: ... }) before shareReplay', status: 'positive' },
          recommended: { text: 'Read-heavy REST endpoints, course details, config data', status: 'positive' }
        }
      },
      {
        id: 'unshared-http',
        name: 'Raw HttpClient.get() (Uncached)',
        badge: 'Cold',
        recommendedUse: 'Endpoints where fresh data is mandatory on every call',
        characteristics: {
          caching: { text: 'No caching; re-executes network call per subscription', status: 'negative' },
          teardown: { text: 'Automatic completion upon HTTP response', status: 'neutral' },
          replay: { text: 'No replay; cold unicast execution', status: 'negative' },
          retry: { text: 'Can retry individual call', status: 'neutral' },
          recommended: { text: 'Form submissions, mutations, payment authorizations', status: 'neutral' }
        }
      },
      {
        id: 'share',
        name: 'share() (Multicast without Replay)',
        badge: 'Hot',
        recommendedUse: 'Sharing in-flight requests without caching historical responses',
        characteristics: {
          caching: { text: 'Shares in-flight execution, but does not cache after completion', status: 'neutral' },
          teardown: { text: 'Unsubscribes when refCount reaches 0', status: 'positive' },
          replay: { text: 'Late subscribers do NOT receive past emission', status: 'negative' },
          retry: { text: 'Retries upstream source', status: 'neutral' },
          recommended: { text: 'Event streams, live telemetry, WebSocket feeds', status: 'neutral' }
        }
      }
    ]
  },

  'reactive-forms': {
    features: [
      { id: 'keystroke', label: 'Keystroke Efficiency' },
      { id: 'cancellation', label: 'In-Flight Cancellation' },
      { id: 'duplication', label: 'Duplicate Payload Suppression' },
      { id: 'validation', label: 'Integrated Form Validity' },
      { id: 'state', label: 'Auto-Save Status Lifecycle' }
    ],
    items: [
      {
        id: 'debounced-stream',
        name: 'valueChanges + debounceTime + switchMap',
        badge: 'Best Practice',
        recommendedUse: 'Modern reactive auto-saving forms',
        characteristics: {
          keystroke: { text: 'Reduces typing bursts by 90%+ via debounceTime(400)', status: 'positive' },
          cancellation: { text: 'switchMap immediately cancels pending in-flight saves on new typing', status: 'positive' },
          duplication: { text: 'distinctUntilChanged discards duplicate serializations', status: 'positive' },
          validation: { text: 'filter(() => form.valid) guarantees only valid data is sent', status: 'positive' },
          state: { text: 'Explicit state machine: pristine | typing | saving | saved | error', status: 'positive' }
        }
      },
      {
        id: 'template-driven',
        name: 'Template-Driven (ngModelChange)',
        badge: 'Legacy',
        recommendedUse: 'Simple single-input forms without auto-save',
        characteristics: {
          keystroke: { text: 'Triggers on every keystroke unless manually debounced with setTimeout', status: 'negative' },
          cancellation: { text: 'No built-in request cancellation', status: 'negative' },
          duplication: { text: 'Manual tracking required to avoid duplicate submits', status: 'negative' },
          validation: { text: 'Template directives ($invalid)', status: 'neutral' },
          state: { text: 'Manual boolean flags (isSaving = true/false)', status: 'neutral' }
        }
      },
      {
        id: 'manual-submit',
        name: 'Manual Submit Button (ngSubmit)',
        badge: 'Explicit',
        recommendedUse: 'High-security transactions and checkout flows',
        characteristics: {
          keystroke: { text: 'Zero background requests; user initiates action', status: 'neutral' },
          cancellation: { text: 'Manual disabling of submit button during in-flight save', status: 'neutral' },
          duplication: { text: 'Requires button disabling to prevent double-click submits', status: 'neutral' },
          validation: { text: 'Checked on submit', status: 'positive' },
          state: { text: 'Simple pending/submitted state', status: 'neutral' }
        }
      }
    ]
  },

  'lifecycle-teardown': {
    features: [
      { id: 'syntax', label: 'Syntax & Ergonomics' },
      { id: 'injection', label: 'Injection Context Requirement' },
      { id: 'leakRisk', label: 'Memory Leak Risk' },
      { id: 'zoneless', label: 'Zoneless Angular 20 Compatibility' },
      { id: 'teardownTiming', label: 'Teardown Execution Timing' }
    ],
    items: [
      {
        id: 'takeUntilDestroyed',
        name: 'takeUntilDestroyed() with DestroyRef',
        badge: 'Modern Angular 20',
        recommendedUse: 'All component and directive subscriptions',
        characteristics: {
          syntax: { text: 'Concise pipe operator; no ngOnDestroy boilerplate', status: 'positive' },
          injection: { text: 'Implicit in constructor; requires inject(DestroyRef) in methods', status: 'positive' },
          leakRisk: { text: 'Zero leak risk when DestroyRef fires', status: 'positive' },
          zoneless: { text: 'First-class support in Angular 20 zoneless applications', status: 'positive' },
          teardownTiming: { text: 'Executes immediately when DestroyRef notifies destroy', status: 'positive' }
        }
      },
      {
        id: 'unmanaged',
        name: 'Unmanaged subscription.subscribe()',
        badge: 'Anti-Pattern (Danger)',
        recommendedUse: 'NEVER for component-scoped subscriptions',
        characteristics: {
          syntax: { text: 'Simple to write initially', status: 'neutral' },
          injection: { text: 'None', status: 'neutral' },
          leakRisk: { text: 'CRITICAL: Retains component instance, leaks memory indefinitely', status: 'negative' },
          zoneless: { text: 'Causes zombie change detection ticks and side-effects', status: 'negative' },
          teardownTiming: { text: 'Never tears down until page refresh', status: 'negative' }
        }
      },
      {
        id: 'asyncPipe',
        name: 'AsyncPipe (| async)',
        badge: 'Declarative Template',
        recommendedUse: 'Template-only observable bindings',
        characteristics: {
          syntax: { text: 'No component code subscription', status: 'positive' },
          injection: { text: 'Handled by Angular template runtime', status: 'positive' },
          leakRisk: { text: 'Zero leak risk; unbinds on view destruction', status: 'positive' },
          zoneless: { text: 'Signals (toSignal) preferred in Angular 20', status: 'neutral' },
          teardownTiming: { text: 'Teardown occurs on view destruction', status: 'positive' }
        }
      }
    ]
  },

  'state-management': {
    features: [
      { id: 'simplicity', label: 'Boilerplate & Learning Curve' },
      { id: 'reactivity', label: 'Reactivity Model' },
      { id: 'selectors', label: 'Selector Optimization' },
      { id: 'signalInterop', label: 'Angular 20 Signal Interop' },
      { id: 'audit', label: 'Time-Travel & Audit Log' }
    ],
    items: [
      {
        id: 'behavior-subject-store',
        name: 'BehaviorSubject Reactive Store',
        badge: 'Lightweight & Pragmatic',
        recommendedUse: 'Feature state, service-driven stores, mid-size apps',
        characteristics: {
          simplicity: { text: 'No external libraries; single TypeScript service', status: 'positive' },
          reactivity: { text: 'BehaviorSubject state$ stream + immutability', status: 'positive' },
          selectors: { text: 'distinctUntilChanged ensures minimal re-computations', status: 'positive' },
          signalInterop: { text: 'Bridges to signals seamlessly with toSignal()', status: 'positive' },
          audit: { text: 'Easy to record audit timeline log of actions and snapshots', status: 'positive' }
        }
      },
      {
        id: 'ngrx-signal-store',
        name: 'NgRx SignalStore',
        badge: 'Signals-First',
        recommendedUse: 'Large enterprise Signal-based applications',
        characteristics: {
          simplicity: { text: 'Requires @ngrx/signals library', status: 'neutral' },
          reactivity: { text: 'Native signals with deep reactivity', status: 'positive' },
          selectors: { text: 'Computed signals memoized by default', status: 'positive' },
          signalInterop: { text: 'Native signals everywhere', status: 'positive' },
          audit: { text: 'Requires custom extensions or devtools', status: 'neutral' }
        }
      },
      {
        id: 'raw-subject',
        name: 'Ad-Hoc Subject in Service',
        badge: 'Fragile',
        recommendedUse: 'Avoid for complex state',
        characteristics: {
          simplicity: { text: 'Primitive and unstructured', status: 'negative' },
          reactivity: { text: 'No initial value, no selector memoization', status: 'negative' },
          selectors: { text: 'Re-emits on any change; no distinct filtering', status: 'negative' },
          signalInterop: { text: 'Requires manual mapping', status: 'negative' },
          audit: { text: 'No state history or snapshot tracking', status: 'negative' }
        }
      }
    ]
  }
};

export const MODULE7_QUIZZES: Record<string, QuizQuestion[]> = {
  'http-patterns': [
    {
      id: 'q-http-1',
      question: 'Why should you include { bufferSize: 1, refCount: true } when using shareReplay on an Angular HTTP request?',
      options: [
        { id: 'a', text: 'To convert the HTTP request into a WebSocket stream' },
        { id: 'b', text: 'To prevent memory leaks by unsubscribing from the source when all subscribers unsubscribe' },
        { id: 'c', text: 'To automatically retry 500 errors indefinitely' },
        { id: 'd', text: 'To serialize the payload into XML format' }
      ],
      correctOptionId: 'b',
      explanation: 'Without refCount: true, shareReplay maintains its subscription to the underlying source observable indefinitely even after all subscribers unsubscribe, which can cause connection leaks and prevent garbage collection if cancelled mid-flight.'
    },
    {
      id: 'q-http-2',
      question: 'Which HTTP status codes should an exponential backoff retry strategy explicitly AVOID retrying?',
      options: [
        { id: 'a', text: '503 Service Unavailable' },
        { id: 'b', text: '504 Gateway Timeout' },
        { id: 'c', text: '4xx Client Errors (such as 400 Bad Request, 401 Unauthorized, 404 Not Found)' },
        { id: 'd', text: '500 Internal Server Error' }
      ],
      correctOptionId: 'c',
      explanation: 'Client errors (4xx) signify invalid client requests, missing authentication, or non-existent resources. Retrying a 404 or 401 with backoff will never succeed and wastes network bandwidth.'
    },
    {
      id: 'q-http-3',
      question: 'In a manual data refresh pipeline, why is switchMap preferred over mergeMap when mapping a refresh$ Subject to an HTTP request?',
      options: [
        { id: 'a', text: 'switchMap executes requests sequentially in FIFO order' },
        { id: 'b', text: 'switchMap cancels any previous pending in-flight request if the user clicks refresh again rapidly' },
        { id: 'c', text: 'switchMap ignores new clicks until the current request finishes' },
        { id: 'd', text: 'switchMap runs requests on a background web worker' }
      ],
      correctOptionId: 'b',
      explanation: 'switchMap unsubscribes from the previous inner observable when a new value arrives. This cancels prior pending HTTP requests, preventing race conditions where outdated responses overwrite newer data.'
    },
    {
      id: 'q-http-4',
      question: 'Where should catchError be placed in an HTTP pipeline to provide fallback data without breaking outer stream subscriptions?',
      options: [
        { id: 'a', text: 'Outside the component constructor' },
        { id: 'b', text: 'Inside the inner HTTP observable stream before returning it to switchMap' },
        { id: 'c', text: 'Directly in the template using the async pipe' },
        { id: 'd', text: 'In the index.html head tag' }
      ],
      correctOptionId: 'b',
      explanation: 'Placing catchError inside the inner observable allows the error to be handled locally and replaced with a fallback observable, keeping the outer stream alive to receive future triggers.'
    }
  ],

  'reactive-forms': [
    {
      id: 'q-forms-1',
      question: 'What is the primary benefit of applying debounceTime(400) to a FormGroup valueChanges observable?',
      options: [
        { id: 'a', text: 'It enforces password complexity validation' },
        { id: 'b', text: 'It pauses emissions until the user stops typing for 400 milliseconds, eliminating excessive HTTP requests' },
        { id: 'c', text: 'It converts form control values to uppercase' },
        { id: 'd', text: 'It delays form submission until the page reloads' }
      ],
      correctOptionId: 'b',
      explanation: 'debounceTime(400) discards rapid interim values emitted during active keystroke bursts, only emitting the latest value after 400ms of inactivity.'
    },
    {
      id: 'q-forms-2',
      question: 'Why is a custom comparator needed when passing distinctUntilChanged to an Angular form.valueChanges stream?',
      options: [
        { id: 'a', text: 'Because RxJS cannot compare boolean values' },
        { id: 'b', text: 'Because form.value emits a new object reference on every keystroke, so default triple-equality (===) would never detect equality' },
        { id: 'c', text: 'Because form controls require asynchronous comparator promises' },
        { id: 'd', text: 'To automatically hash the form input using SHA-256' }
      ],
      correctOptionId: 'b',
      explanation: 'By default, distinctUntilChanged checks previous === current. Since valueChanges emits a new object reference on each change, a custom comparator (e.g. comparing JSON strings or specific keys) is necessary to detect true value equality.'
    },
    {
      id: 'q-forms-3',
      question: 'In an auto-save pipeline, what operator sequence best handles debounced saving with cancellation of in-flight saves?',
      codeSnippet: `form.valueChanges.pipe(
  debounceTime(400),
  distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
  filter(() => form.valid),
  switchMap(data => http.put(...))
)`,
      options: [
        { id: 'a', text: 'concatMap followed by delay' },
        { id: 'b', text: 'debounceTime -> distinctUntilChanged -> filter(valid) -> switchMap' },
        { id: 'c', text: 'mergeMap -> take(1) -> retry' },
        { id: 'd', text: 'exhaustMap -> sampleTime(100)' }
      ],
      correctOptionId: 'b',
      explanation: 'This pipeline debounces typing, eliminates duplicate values, guarantees only valid form states proceed, and uses switchMap to cancel any in-flight PUT if another edit occurs.'
    },
    {
      id: 'q-forms-4',
      question: 'How should you reactively update dropdown options in Field B based on the selected value of Field A?',
      options: [
        { id: 'a', text: 'Listen to fieldA.valueChanges.pipe(map(val => getOptionsFor(val))) and bind to field B' },
        { id: 'b', text: 'Poll field A using window.setInterval' },
        { id: 'c', text: 'Use a MutationObserver on the select element in the DOM' },
        { id: 'd', text: 'Attach an onclick listener to the body tag' }
      ],
      correctOptionId: 'a',
      explanation: 'Using fieldA.valueChanges as an observable stream allows declarative, reactive derivation of dependent options without polling or manual event listeners.'
    }
  ],

  'lifecycle-teardown': [
    {
      id: 'q-life-1',
      question: 'What happens if a long-lived subscription (e.g. interval) in an Angular component is created without teardown management?',
      options: [
        { id: 'a', text: 'Angular automatically detects and kills it upon component destroy' },
        { id: 'b', text: 'The subscription closure retains the component instance in memory, creating a memory leak and continuing to execute in the background' },
        { id: 'c', text: 'The browser tab immediately crashes' },
        { id: 'd', text: 'The interval stops emitting as soon as the DOM node is removed' }
      ],
      correctOptionId: 'b',
      explanation: 'RxJS observables are decoupled from the Angular view lifecycle. Unless cancelled, the subscription holds a reference to the component instance in memory, causing a zombie subscription leak.'
    },
    {
      id: 'q-life-2',
      question: 'When using takeUntilDestroyed() OUTSIDE of an Angular injection context (e.g. inside a method or ngOnInit), what is required?',
      options: [
        { id: 'a', text: 'You must provide a string identifier' },
        { id: 'b', text: 'You must pass an explicit DestroyRef reference: takeUntilDestroyed(this.destroyRef)' },
        { id: 'c', text: 'You must call ngOnDestroy manually' },
        { id: 'd', text: 'It is not possible to use takeUntilDestroyed outside the constructor' }
      ],
      correctOptionId: 'b',
      explanation: 'When called inside the constructor, takeUntilDestroyed automatically infers DestroyRef from the current injection context. Outside of an injection context, you must explicitly inject DestroyRef and pass it as an argument.'
    },
    {
      id: 'q-life-3',
      question: 'If an observable stream completes naturally before the component is destroyed, what does takeUntilDestroyed do?',
      options: [
        { id: 'a', text: 'It throws an UnhandledException error' },
        { id: 'b', text: 'It safely cleans up its internal teardown listener without error' },
        { id: 'c', text: 'It restarts the completed observable' },
        { id: 'd', text: 'It triggers change detection twice' }
      ],
      correctOptionId: 'b',
      explanation: 'takeUntilDestroyed cleanly unsubscribes when the source completes naturally. Subsequent destruction of the component causes no errors (tested in F41.5).'
    },
    {
      id: 'q-life-4',
      question: 'Which Angular operator executes teardown callbacks when an unmanaged or managed stream terminates?',
      options: [
        { id: 'a', text: 'startWith' },
        { id: 'b', text: 'finalize(() => { ... })' },
        { id: 'c', text: 'defaultIfEmpty' },
        { id: 'd', text: 'scan' }
      ],
      correctOptionId: 'b',
      explanation: 'The finalize operator executes its callback when the source observable completes, errors, or is unsubscribed, making it ideal for tracking teardown execution.'
    }
  ],

  'state-management': [
    {
      id: 'q-state-1',
      question: 'Why does a reactive state store service use BehaviorSubject instead of a standard Subject?',
      options: [
        { id: 'a', text: 'Because BehaviorSubject allows bidirectional HTTP streaming' },
        { id: 'b', text: 'Because BehaviorSubject requires an initial state and immediately replays the current state value to any new subscriber' },
        { id: 'c', text: 'Because BehaviorSubject cannot be unsubscribed from' },
        { id: 'd', text: 'Because BehaviorSubject executes synchronously on a worker thread' }
      ],
      correctOptionId: 'b',
      explanation: 'BehaviorSubject stores the current state in memory and provides synchronous access via getValue() as well as immediate emission to any new subscriber upon subscription.'
    },
    {
      id: 'q-state-2',
      question: 'Why must state updates in a BehaviorSubject store be performed immutably (e.g. { ...state, property: value })?',
      options: [
        { id: 'a', text: 'To ensure TypeScript compiles faster' },
        { id: 'b', text: 'To preserve historical state integrity, allow time-travel auditing, and trigger distinctUntilChanged checks properly' },
        { id: 'c', text: 'Because JavaScript arrays cannot be mutated' },
        { id: 'd', text: 'To prevent the browser from reloading' }
      ],
      correctOptionId: 'b',
      explanation: 'Mutating state in-place changes the internal properties of the existing object, breaking change detection, selector memoization (distinctUntilChanged), and audit/undo history.'
    },
    {
      id: 'q-state-3',
      question: 'How does distinctUntilChanged optimize state selectors in a BehaviorSubject store?',
      options: [
        { id: 'a', text: 'It prevents the selector from emitting when unrelated state properties change but the selected slice value remains unchanged' },
        { id: 'b', text: 'It caches the emissions in IndexedDB' },
        { id: 'c', text: 'It encrypts the emitted data' },
        { id: 'd', text: 'It delays emissions by 1 second' }
      ],
      correctOptionId: 'a',
      explanation: 'When state.update() is called for theme, a distinctUntilChanged selector for count will not emit because count has not changed, preventing unnecessary downstream calculations or component renders.'
    },
    {
      id: 'q-state-4',
      question: 'How does Angular 20 toSignal() enhance consuming store selectors in zoneless component templates?',
      options: [
        { id: 'a', text: 'It converts the template into pure HTML canvas' },
        { id: 'b', text: 'It bridges the selector observable to a reactive signal with automatic subscription management, enabling direct template evaluation without async pipes' },
        { id: 'c', text: 'It converts observables into web workers' },
        { id: 'd', text: 'It forces manual change detection on every tick' }
      ],
      correctOptionId: 'b',
      explanation: 'toSignal() subscribes to the selector observable under the hood within the injection context, manages unsubscription on component destruction, and provides a synchronous Signal value for optimal zoneless change detection.'
    }
  ]
};
