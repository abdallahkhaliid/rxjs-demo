import { OperatorMetadata, ComparisonData, QuizQuestion } from '../../core/models';
import { HooOperatorConfig, HooOperatorType } from './module4.models';

export interface HooTopicData extends HooOperatorConfig {
  metadata: OperatorMetadata;
  comparison: ComparisonData;
  quiz: QuizQuestion[];
}

export const MODULE4_MASTER_COMPARISON: ComparisonData = {
  features: [
    { id: 'concurrency', label: 'Concurrency Strategy', description: 'Number of inner streams executing simultaneously' },
    { id: 'preemption', label: 'On Outer Emission', description: 'What happens when a new outer item arrives during in-flight inner' },
    { id: 'queuing', label: 'Queuing Behavior', description: 'Does it buffer future emissions for subsequent execution' },
    { id: 'dropping', label: 'Drops Emissions', description: 'Are rapid outer emissions silently ignored or lost' },
    { id: 'ordering', label: 'Order Preservation', description: 'Guarantees output emissions match outer arrival order' },
    { id: 'cancellation', label: 'Cancellation Support', description: 'Aborts inner observable execution mid-flight' },
    { id: 'usecase', label: 'Primary Use Case', description: 'Standard recommended architectural pattern' },
    { id: 'antipattern', label: 'Major Anti-Pattern', description: 'Scenario that causes data loss or blocking' }
  ],
  items: [
    {
      id: 'switchMap',
      name: 'switchMap',
      badge: 'Preemptive / Cancel',
      recommendedUse: 'Typeahead search, live tab switching, route param changes',
      characteristics: {
        concurrency: { text: '1 active (cancels previous)', status: 'positive' },
        preemption: { text: 'Aborts active inner stream', status: 'neutral' },
        queuing: { text: 'No queuing (immediate preemption)', status: 'neutral' },
        dropping: { text: 'No dropping (switches to latest)', status: 'positive' },
        ordering: { text: 'Latest result only (no stale data)', status: 'positive' },
        cancellation: { text: 'Yes, triggers inner teardown', status: 'positive' },
        usecase: { text: 'Autocomplete search, GET queries', status: 'positive' },
        antipattern: { text: 'Non-idempotent HTTP POST/DELETE', status: 'negative' }
      }
    },
    {
      id: 'mergeMap',
      name: 'mergeMap',
      badge: 'Concurrent / Parallel',
      recommendedUse: 'Batch file uploads, parallel asset fetches, independent events',
      characteristics: {
        concurrency: { text: 'N concurrent (default Infinity)', status: 'positive' },
        preemption: { text: 'Runs concurrently in parallel', status: 'positive' },
        queuing: { text: 'Queues when concurrency limit reached', status: 'neutral' },
        dropping: { text: 'Never drops emissions', status: 'positive' },
        ordering: { text: 'First-to-finish (race interleaving)', status: 'neutral' },
        cancellation: { text: 'Only on outer unsubscription', status: 'neutral' },
        usecase: { text: 'Parallel fetches, batch pipelines', status: 'positive' },
        antipattern: { text: 'Uncontrolled concurrency (socket exhaustion)', status: 'negative' }
      }
    },
    {
      id: 'concatMap',
      name: 'concatMap',
      badge: 'Sequential / Queue',
      recommendedUse: 'Sequential saves, ordered queue operations, chat messages',
      characteristics: {
        concurrency: { text: '1 active (strict sequential FIFO)', status: 'neutral' },
        preemption: { text: 'Queues until current completes', status: 'positive' },
        queuing: { text: 'Strict FIFO unbounded queue', status: 'positive' },
        dropping: { text: 'Never drops emissions', status: 'positive' },
        ordering: { text: 'Strict outer arrival order preserved', status: 'positive' },
        cancellation: { text: 'Only on outer unsubscription', status: 'neutral' },
        usecase: { text: 'Ordered persistence, sequential writes', status: 'positive' },
        antipattern: { text: 'Head-of-line blocking (inner never completes)', status: 'negative' }
      }
    },
    {
      id: 'exhaustMap',
      name: 'exhaustMap',
      badge: 'Ignorer / Guard',
      recommendedUse: 'Button double-click debouncing, login submit, payment checkouts',
      characteristics: {
        concurrency: { text: '1 active (drops incoming while busy)', status: 'neutral' },
        preemption: { text: 'Ignores outer emission completely', status: 'neutral' },
        queuing: { text: 'No queuing (dropped immediately)', status: 'neutral' },
        dropping: { text: 'Yes, drops all during in-flight', status: 'neutral' },
        ordering: { text: 'First request only until completion', status: 'positive' },
        cancellation: { text: 'No preemption or aborting', status: 'neutral' },
        usecase: { text: 'Form submission, login, refresh clicks', status: 'positive' },
        antipattern: { text: 'Permanent lockout if inner hangs', status: 'negative' }
      }
    }
  ]
};

export const MODULE4_OPERATORS: Record<HooOperatorType, HooTopicData> = {
  switchMap: {
    id: 'switchMap',
    slug: 'switch-map',
    name: 'switchMap',
    title: 'switchMap — Preemptive Stream Switching',
    subtitle: 'Cancels the active inner Observable whenever a new outer item arrives',
    signature: 'switchMap<T, R>(project: (value: T, index: number) => ObservableInput<R>): OperatorFunction<T, R>',
    summary: 'Maps each source value to an inner Observable, immediately unsubscribing from and cancelling the prior in-flight inner Observable.',
    description: 'switchMap is the cornerstone flattening operator for read scenarios. Whenever the source stream produces an emission, switchMap unsubscribes from the currently executing inner observable (triggering cancellation of pending HTTP requests or timers) and subscribes to the newly produced inner observable. This guarantees that stale results never overwrite fresh data.',
    concurrencyDefault: 1,
    concurrencyMin: 1,
    concurrencyMax: 1,
    allowConcurrencyControl: false,
    useCases: [
      'Typeahead search inputs (discarding previous queries when user types new character)',
      'Route parameter changes triggering data fetches in Angular services',
      'Tab switching where only the active tab content should be fetched'
    ],
    pitfalls: [
      'Using switchMap for non-idempotent operations like HTTP POST or payment submission can cancel valid writes before the server acknowledges them',
      'If an inner observable throws an error without inner catchError(), the entire outer stream terminates permanently (F36.B1)'
    ],
    marbleRules: [
      'Outer emission #1 starts inner observable #1',
      'Outer emission #2 immediately unsubscribes/cancels inner #1 if still active',
      'Only the latest inner observable can emit values and complete'
    ],
    codeSnippet: `import { fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

// Auto-cancelling typeahead search
const searchInput = document.getElementById('search-box') as HTMLInputElement;

fromEvent(searchInput, 'input').pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(event => {
    const term = (event.target as HTMLInputElement).value;
    return fetchResults(term).pipe(
      // Isolate errors inside the inner stream to keep the search box alive!
      catchError(err => {
        console.error('Inner search failed:', err);
        return of([]);
      })
    );
  })
).subscribe(results => renderSearchResults(results));`,
    errorHandlingSnippet: `import { Subject, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';

const trigger$ = new Subject<number>();

// CORRECT: inner catchError prevents outer stream termination
trigger$.pipe(
  switchMap(id =>
    fetchItem(id).pipe(
      catchError(err => {
        console.warn('Item fetch failed, returning fallback:', err);
        return of({ id, fallback: true });
      })
    )
  )
).subscribe({
  next: data => console.log('Received:', data),
  error: err => console.error('Outer stream died:', err) // Never triggers!
});`,
    angularPatternSnippet: `import { Component, inject, signal } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-search-demo',
  template: \`
    <input (input)="query.set($any($event.target).value)" placeholder="Search..." />
    <ul>
      @for (item of results(); track item.id) {
        <li>{{ item.name }}</li>
      }
    </ul>
  \`
})
export class SearchDemoComponent {
  private http = inject(HttpClient);
  readonly query = signal('');

  // Reactive pipeline: signal -> observable -> switchMap -> signal
  readonly results = toSignal(
    toObservable(this.query).pipe(
      switchMap(term =>
        this.http.get<any[]>(\`/api/courses?filter=\${encodeURIComponent(term)}\`).pipe(
          catchError(() => of([]))
        )
      )
    ),
    { initialValue: [] }
  );
}`,
    metadata: {
      name: 'switchMap',
      category: 'Transformation',
      signature: 'switchMap<T, R>(project: (value: T, index: number) => ObservableInput<R>): OperatorFunction<T, R>',
      summary: 'Projects each source value to an Observable, cancelling the previous inner Observable when a new one arrives.',
      description: 'Maps each source value to an Observable and flattens it, cancelling previous inner streams on new outer emissions.',
      difficulty: 'intermediate',
      useCases: ['Typeahead search', 'Route navigation fetching', 'Tab switching'],
      pitfalls: ['Cancels in-flight requests (risky for POST/PUT/DELETE)', 'Uncaught inner error terminates outer stream'],
      marbleRules: ['Outer emission cancels active inner', 'Only latest inner emits'],
      relatedOperators: ['mergeMap', 'concatMap', 'exhaustMap', 'switchAll'],
      docUrl: 'https://rxjs.dev/api/operators/switchMap'
    },
    comparison: MODULE4_MASTER_COMPARISON,
    quiz: [
      {
        id: 'sm-q1',
        question: 'What occurs when a new outer value arrives while an inner observable in switchMap is still running?',
        options: [
          { id: 'a', text: 'The new value is placed in a FIFO queue waiting for the inner to complete' },
          { id: 'b', text: 'The active inner observable is immediately unsubscribed and cancelled, and the new inner starts' },
          { id: 'c', text: 'The new value is discarded/ignored while the active inner is in flight' },
          { id: 'd', text: 'Both inner observables run concurrently in parallel' }
        ],
        correctOptionId: 'b',
        explanation: 'switchMap strictly maintains a concurrency of 1 and operates preemptively: any active inner observable is unsubscribed/aborted the instant a new outer emission arrives.'
      },
      {
        id: 'sm-q2',
        question: 'If an inner observable inside switchMap throws an uncaught error, what happens to the outer pipeline?',
        options: [
          { id: 'a', text: 'The outer stream ignores the error and continues listening for future outer emissions' },
          { id: 'b', text: 'The error terminates the entire outer stream unless caught internally within the inner observable using catchError()' },
          { id: 'c', text: 'switchMap automatically retries the inner observable 3 times' },
          { id: 'd', text: 'The inner error is converted to EMPTY automatically by RxJS' }
        ],
        correctOptionId: 'b',
        explanation: 'According to RxJS contract F36.B1, an unhandled error inside any inner observable bubbles up and terminates the outer subscription permanently. To prevent this, catchError() must be piped directly onto the inner observable.'
      },
      {
        id: 'sm-q3',
        question: 'Why is switchMap generally considered an anti-pattern for HTTP POST or PUT mutations (e.g. saving a record)?',
        options: [
          { id: 'a', text: 'Because switchMap is slower than concatMap for network transfers' },
          { id: 'b', text: 'Because rapid user actions will cancel the prior HTTP request mid-flight, potentially causing incomplete or skipped database writes' },
          { id: 'c', text: 'Because switchMap cannot serialize JSON payloads' },
          { id: 'd', text: 'Because HTTP headers cannot be passed through switchMap' }
        ],
        correctOptionId: 'b',
        explanation: 'For non-idempotent mutations, cancelling the previous HTTP request when the user triggers a second save can leave the server in an inconsistent state or discard legitimate changes. Use concatMap or exhaustMap instead.'
      },
      {
        id: 'sm-q4',
        question: 'In a search typeahead with 3 rapid keystrokes ("a", "ab", "abc"), how many results will switchMap emit if each API call takes 200ms and typing intervals are 50ms?',
        options: [
          { id: 'a', text: '3 results, one for each keystroke' },
          { id: 'b', text: 'Only 1 result: the response for "abc", because queries for "a" and "ab" were cancelled before completion' },
          { id: 'c', text: '0 results because rapid typing triggers rate limiting' },
          { id: 'd', text: '2 results: "a" and "abc"' }
        ],
        correctOptionId: 'b',
        explanation: 'Because keystrokes arrived at t=0ms, 50ms, and 100ms while each request takes 200ms, request 1 is cancelled at t=50ms and request 2 is cancelled at t=100ms. Only request 3 runs to completion (at t=300ms).'
      }
    ]
  },
  mergeMap: {
    id: 'mergeMap',
    slug: 'merge-map',
    name: 'mergeMap',
    title: 'mergeMap — Concurrent Stream Merging',
    subtitle: 'Runs inner Observables concurrently in parallel with optional concurrency limit',
    signature: 'mergeMap<T, R>(project: (value: T, index: number) => ObservableInput<R>, concurrent: number = Infinity): OperatorFunction<T, R>',
    summary: 'Projects each source value to an Observable which is merged in parallel into the output stream up to an optional concurrency limit.',
    description: 'mergeMap (also known as flatMap) subscribes to every inner observable as soon as outer values arrive, processing them in parallel without preemption or sequential delays. Output emissions arrive in race order (whichever inner finishes first). A second parameter controls maximum concurrency: when set to 1, mergeMap becomes functionally identical to concatMap.',
    concurrencyDefault: 2,
    concurrencyMin: 1,
    concurrencyMax: 10,
    allowConcurrencyControl: true,
    useCases: [
      'Batch downloading or uploading multiple files concurrently',
      'Fetching details for multiple IDs in parallel when order does not matter',
      'Event fan-out pipelines with controlled socket/thread utilization'
    ],
    pitfalls: [
      'Unbounded concurrency (default Infinity) with high emission rates can overwhelm backend servers or exhaust browser HTTP connection limits (usually 6 per domain)',
      'Out-of-order delivery: faster responses arrive before slower responses, potentially causing race conditions if state relies on sequence'
    ],
    marbleRules: [
      'Each outer emission spawns an active inner observable immediately (if under concurrency limit)',
      'Results emit to the output stream in whatever order the inner streams finish',
      'When concurrency limit is reached, subsequent requests queue until a slot opens'
    ],
    codeSnippet: `import { from, of } from 'rxjs';
import { mergeMap, delay } from 'rxjs/operators';

// Fetch details for 5 items with a concurrency limit of 2 parallel requests
const itemIds = [1, 2, 3, 4, 5];

from(itemIds).pipe(
  mergeMap(id => {
    // Simulated random latency
    const randomLatency = Math.floor(Math.random() * 800) + 200;
    return of({ id, latency: randomLatency }).pipe(delay(randomLatency));
  }, 2) // Limit: exactly 2 concurrent requests at any moment!
).subscribe(result => {
  console.log(\`Finished item #\${result.id} in \${result.latency}ms\`);
});`,
    errorHandlingSnippet: `import { from, of } from 'rxjs';
import { mergeMap, catchError } from 'rxjs/operators';

const batch = [1, 2, 3, 4];

// Resilient batch execution: individual failure does not abort remaining batch items
from(batch).pipe(
  mergeMap(id =>
    uploadItem(id).pipe(
      catchError(err => {
        console.error(\`Item \${id} failed upload:\`, err);
        return of({ id, status: 'failed', error: err.message });
      })
    ),
    2 // Concurrency limit
  )
).subscribe(result => console.log('Upload result:', result));`,
    angularPatternSnippet: `import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

@Component({
  standalone: true,
  selector: 'app-batch-uploader',
  template: \`<button (click)="uploadAll()">Upload Batch (Concurrency 3)</button>\`
})
export class BatchUploaderComponent {
  private http = inject(HttpClient);
  files = ['doc1.pdf', 'doc2.pdf', 'doc3.pdf', 'doc4.pdf', 'doc5.pdf'];

  uploadAll() {
    from(this.files).pipe(
      mergeMap(fileName => {
        const formData = new FormData();
        formData.append('file', fileName);
        return this.http.post('/api/upload', formData);
      }, 3) // Concurrency limit of 3 concurrent uploads
    ).subscribe({
      next: res => console.log('Uploaded chunk:', res),
      complete: () => console.log('All files uploaded!')
    });
  }
}`,
    metadata: {
      name: 'mergeMap',
      category: 'Transformation',
      signature: 'mergeMap<T, R>(project: (value: T, index: number) => ObservableInput<R>, concurrent?: number): OperatorFunction<T, R>',
      summary: 'Projects each source value to an Observable which is merged concurrently into the output stream.',
      description: 'Flattens inner observables in parallel. Output values emit as soon as they complete in race order.',
      difficulty: 'intermediate',
      useCases: ['Parallel HTTP calls', 'Concurrent batch file upload', 'Multi-source event merging'],
      pitfalls: ['Race conditions due to interleaved arrival order', 'Socket saturation if concurrency is unbounded'],
      marbleRules: ['Spawns concurrent inner streams', 'Emits in order of completion'],
      relatedOperators: ['switchMap', 'concatMap', 'exhaustMap', 'mergeAll'],
      docUrl: 'https://rxjs.dev/api/operators/mergeMap'
    },
    comparison: MODULE4_MASTER_COMPARISON,
    quiz: [
      {
        id: 'mm-q1',
        question: 'What is the default concurrency limit of mergeMap when no second argument is supplied?',
        options: [
          { id: 'a', text: '1' },
          { id: 'b', text: 'Infinity (unbounded concurrent subscriptions)' },
          { id: 'c', text: '4 (matching CPU cores)' },
          { id: 'd', text: '6 (matching browser HTTP connection limit)' }
        ],
        correctOptionId: 'b',
        explanation: 'By default, mergeMap has concurrency = Infinity, meaning every outer emission immediately subscribes to an inner observable regardless of how many are already running.'
      },
      {
        id: 'mm-q2',
        question: 'What happens when you execute mergeMap(project, 1) with concurrency limit set to 1?',
        options: [
          { id: 'a', text: 'It behaves identically to concatMap(project)' },
          { id: 'b', text: 'It behaves identically to exhaustMap(project)' },
          { id: 'c', text: 'It throws a runtime ArgumentError because mergeMap requires concurrency >= 2' },
          { id: 'd', text: 'It cancels the active request whenever a new value arrives' }
        ],
        correctOptionId: 'a',
        explanation: 'As verified by F36.B4, concatMap is an alias for mergeMap with concurrency = 1. It executes requests strictly one-at-a-time in sequential FIFO order.'
      },
      {
        id: 'mm-q3',
        question: 'Req 1 takes 30ms. Req 2 arrives at t=5ms and takes 10ms. Under standard mergeMap, in what order do emissions arrive?',
        options: [
          { id: 'a', text: 'Req 1 first, then Req 2' },
          { id: 'b', text: 'Req 2 first (at t=15ms), then Req 1 (at t=30ms)' },
          { id: 'c', text: 'Both emit at t=30ms simultaneously' },
          { id: 'd', text: 'Req 1 is cancelled so only Req 2 emits' }
        ],
        correctOptionId: 'b',
        explanation: 'Because mergeMap processes inner observables in parallel without blocking, faster inner streams finish and emit before slower ones regardless of outer arrival sequence (F36.3).'
      },
      {
        id: 'mm-q4',
        question: 'When should you configure an explicit concurrency limit (e.g. 2 or 3) on mergeMap?',
        options: [
          { id: 'a', text: 'To avoid overloading database connections or exceeding API rate limits during bulk operations' },
          { id: 'b', text: 'To automatically catch runtime errors without try/catch' },
          { id: 'c', text: 'Because Angular Signals do not support unbounded Observables' },
          { id: 'd', text: 'To force inner observables to return Promises instead of Observables' }
        ],
        correctOptionId: 'a',
        explanation: 'Passing a concurrency parameter throttles simultaneous execution, queuing surplus requests until active slots free up. This prevents server socket exhaustion and 429 Too Many Requests errors.'
      }
    ]
  },
  concatMap: {
    id: 'concatMap',
    slug: 'concat-map',
    name: 'concatMap',
    title: 'concatMap — Sequential FIFO Queueing',
    subtitle: 'Executes inner Observables strictly one-by-one in arrival sequence',
    signature: 'concatMap<T, R>(project: (value: T, index: number) => ObservableInput<R>): OperatorFunction<T, R>',
    summary: 'Projects each source value to an Observable and concatenates them sequentially in strict FIFO order.',
    description: 'concatMap queues subsequent outer emissions until the currently active inner observable emits complete. It guarantees that operations are executed and emitted in the exact sequence they arrived. Nothing is cancelled and nothing is dropped. However, if any inner observable fails to complete, all subsequent queued items are blocked indefinitely.',
    concurrencyDefault: 1,
    concurrencyMin: 1,
    concurrencyMax: 1,
    allowConcurrencyControl: false,
    useCases: [
      'Sequential HTTP write operations (POST, PUT, DELETE) where ordering matters',
      'Sending chat messages or transaction logs that must be stored in exact sequence',
      'Step-by-step wizard wizards where stage N+1 depends on stage N completion'
    ],
    pitfalls: [
      'Head-of-line blocking: If an inner observable never completes (e.g. interval() without take(), or an infinite Subject), the queue will never advance',
      'Queue memory bloat: Rapid outer emissions can build up a massive pending queue if inner operations take longer than emission frequency'
    ],
    marbleRules: [
      'Outer emission #1 starts immediately as active inner #1',
      'Outer emissions #2 and #3 enter the queue (FIFO)',
      'When inner #1 completes, inner #2 starts immediately',
      'Outputs are delivered in strict sequential order'
    ],
    codeSnippet: `import { from, of } from 'rxjs';
import { concatMap, delay } from 'rxjs/operators';

// Sequence of database update operations that must run one after another
const updates = [
  { id: 101, action: 'CREATE_RECORD' },
  { id: 102, action: 'ATTACH_TAG' },
  { id: 103, action: 'SEND_NOTIFICATION' }
];

from(updates).pipe(
  concatMap(op => {
    console.log(\`Starting \${op.action}...\`);
    return of(\`Completed \${op.action}\`).pipe(delay(500));
  })
).subscribe(msg => console.log(msg));`,
    errorHandlingSnippet: `import { Subject, of } from 'rxjs';
import { concatMap, catchError } from 'rxjs/operators';

const queue$ = new Subject<{ id: number; data: string }>();

// Ensure an individual item error does NOT destroy the entire queue
queue$.pipe(
  concatMap(item =>
    processTransaction(item).pipe(
      catchError(err => {
        console.error(\`Transaction \${item.id} failed:\`, err);
        // Emitting a failure token allows the queue to proceed to the next item!
        return of({ id: item.id, status: 'error', error: err.message });
      })
    )
  )
).subscribe(res => console.log('Processed:', res));`,
    angularPatternSnippet: `import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { concatMap } from 'rxjs/operators';

@Component({
  standalone: true,
  selector: 'app-chat-sender',
  template: \`
    <input #msgInput placeholder="Type message..." />
    <button (click)="send(msgInput.value); msgInput.value = ''">Send</button>
  \`
})
export class ChatSenderComponent {
  private http = inject(HttpClient);
  private messageQueue$ = new Subject<string>();

  constructor() {
    // Guaranteed sequential delivery matching user typing order
    this.messageQueue$.pipe(
      concatMap(text => this.http.post('/api/messages', { text, sentAt: Date.now() }))
    ).subscribe(result => console.log('Message delivered:', result));
  }

  send(text: string) {
    if (text.trim()) this.messageQueue$.next(text.trim());
  }
}`,
    metadata: {
      name: 'concatMap',
      category: 'Transformation',
      signature: 'concatMap<T, R>(project: (value: T, index: number) => ObservableInput<R>): OperatorFunction<T, R>',
      summary: 'Projects each source value to an Observable and concatenates them sequentially in strict FIFO order.',
      description: 'Preserves strict sequential order by queueing subsequent inner observables until active finishes.',
      difficulty: 'intermediate',
      useCases: ['Sequential HTTP writes', 'Queued order processing', 'Deterministic state machines'],
      pitfalls: ['Head-of-line blocking if inner never completes', 'Memory accumulation under burst inputs'],
      marbleRules: ['Queues items while active is running', 'Strict FIFO execution'],
      relatedOperators: ['mergeMap', 'switchMap', 'exhaustMap', 'concatAll'],
      docUrl: 'https://rxjs.dev/api/operators/concatMap'
    },
    comparison: MODULE4_MASTER_COMPARISON,
    quiz: [
      {
        id: 'cm-q1',
        question: 'How does concatMap manage incoming outer emissions while an inner observable is currently executing?',
        options: [
          { id: 'a', text: 'It cancels the active inner observable immediately' },
          { id: 'b', text: 'It ignores and drops all new incoming outer emissions' },
          { id: 'c', text: 'It queues them in an internal FIFO queue and executes them one after another upon completion' },
          { id: 'd', text: 'It executes them immediately in parallel threads' }
        ],
        correctOptionId: 'c',
        explanation: 'concatMap uses a strict First-In-First-Out queue (F36.2). Each queued inner observable waits until the preceding inner observable completes.'
      },
      {
        id: 'cm-q2',
        question: 'What serious architectural bug is known as "Head-of-Line Blocking" in concatMap pipelines?',
        options: [
          { id: 'a', text: 'When an inner observable throws a syntax error on parse' },
          { id: 'b', text: 'When an inner observable never completes (e.g. interval() without take()), permanently freezing the queue so no queued items can ever execute' },
          { id: 'c', text: 'When the HTTP response exceeds 64KB' },
          { id: 'd', text: 'When two Observables share the same subscriber name' }
        ],
        correctOptionId: 'b',
        explanation: 'Because concatMap only triggers the next inner observable when the current one fires complete, an inner observable that stays open forever permanently stalls the entire queue.'
      },
      {
        id: 'cm-q3',
        question: 'If 50 rapid sequential emissions are pushed into concatMap, how many will be delivered to the subscriber?',
        options: [
          { id: 'a', text: 'Only the 1st one' },
          { id: 'b', text: 'Only the 50th one' },
          { id: 'c', text: 'All 50 emissions in exact sequential index order (0 to 49) without any item loss' },
          { id: 'd', text: 'It caps at 10 items due to browser limits' }
        ],
        correctOptionId: 'c',
        explanation: 'As proven by boundary test F36.B2, concatMap queues all 50 rapid emissions and executes each sequentially without dropping or losing any items.'
      },
      {
        id: 'cm-q4',
        question: 'Which scenario is concatMap BEST suited for compared to switchMap or mergeMap?',
        options: [
          { id: 'a', text: 'Real-time mouse move tracking' },
          { id: 'b', text: 'Saving items to a database where order must be strictly preserved and prior saves must never be aborted' },
          { id: 'c', text: 'Downloading 50 independent image thumbnails simultaneously' },
          { id: 'd', text: 'Typeahead query autocomplete' }
        ],
        correctOptionId: 'b',
        explanation: 'For ordered persistence operations where intermediate saves cannot be aborted (unlike switchMap) and cannot arrive out of order (unlike mergeMap), concatMap is the gold standard.'
      }
    ]
  },
  exhaustMap: {
    id: 'exhaustMap',
    slug: 'exhaust-map',
    name: 'exhaustMap',
    title: 'exhaustMap — Guarded Stream Ignorer',
    subtitle: 'Ignores incoming outer values completely while an inner Observable is in-flight',
    signature: 'exhaustMap<T, R>(project: (value: T, index: number) => ObservableInput<R>): OperatorFunction<T, R>',
    summary: 'Projects each source value to an Observable, ignoring new source values while the current inner Observable is still executing.',
    description: 'exhaustMap acts as a gatekeeper. When an outer emission arrives, exhaustMap starts its inner observable and locks the gate. Any additional outer emissions that arrive while the inner observable is active are dropped and completely discarded. Once the active inner observable completes, the gate unlocks and the next outer emission is welcomed.',
    concurrencyDefault: 1,
    concurrencyMin: 1,
    concurrencyMax: 1,
    allowConcurrencyControl: false,
    useCases: [
      'Button double-click prevention (Login buttons, Checkout / Pay Now)',
      'Refresh or sync buttons to prevent spamming background synchronization tasks',
      'Guarded modal confirmations and single-run batch actions'
    ],
    pitfalls: [
      'Permanent lockout: If the inner observable never emits complete (e.g. an uncompleted Subject or interval), exhaustMap stays locked forever and drops all future outer emissions (F36.B3)',
      'Data loss if used for continuous streams: Not suitable when every emission carries distinct data that must be processed'
    ],
    marbleRules: [
      'Outer emission #1 starts active inner #1 and locks the stream',
      'Outer emissions #2 and #3 arrive while #1 is active and are dropped/ignored',
      'When inner #1 completes, the lock is released',
      'Outer emission #4 starts fresh inner #4'
    ],
    codeSnippet: `import { fromEvent } from 'rxjs';
import { exhaustMap } from 'rxjs/operators';

// Prevent duplicate payment submissions on fast button double-clicks
const payButton = document.getElementById('pay-btn') as HTMLButtonElement;

fromEvent(payButton, 'click').pipe(
  exhaustMap(() => {
    console.log('Processing payment...');
    return submitPaymentTransaction(); // Takes 2000ms to complete
  })
).subscribe({
  next: receipt => console.log('Payment confirmed:', receipt),
  error: err => console.error('Payment error:', err)
});`,
    errorHandlingSnippet: `import { Subject, of } from 'rxjs';
import { exhaustMap, catchError } from 'rxjs/operators';

const loginClicks$ = new Subject<void>();

// Ensure login failures unlock the exhaustMap gate so the user can retry!
loginClicks$.pipe(
  exhaustMap(() =>
    performLogin().pipe(
      catchError(err => {
        console.warn('Login attempt failed, unlocking button for retry:', err);
        // Emitting a fallback completes the inner stream, unlocking the gate!
        return of({ success: false, reason: err.message });
      })
    )
  )
).subscribe(res => updateLoginUi(res));`,
    angularPatternSnippet: `import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { exhaustMap, tap } from 'rxjs/operators';

@Component({
  standalone: true,
  selector: 'app-checkout-button',
  template: \`
    <button (click)="submitOrder()" [disabled]="isSubmitting()">
      {{ isSubmitting() ? 'Processing Order...' : 'Place Order' }}
    </button>
  \`
})
export class CheckoutButtonComponent {
  private http = inject(HttpClient);
  readonly isSubmitting = signal(false);
  private submitClick$ = new Subject<void>();

  constructor() {
    this.submitClick$.pipe(
      tap(() => this.isSubmitting.set(true)),
      exhaustMap(() =>
        this.http.post('/api/orders', { cartId: 42 }).pipe(
          tap({
            complete: () => this.isSubmitting.set(false),
            error: () => this.isSubmitting.set(false)
          })
        )
      )
    ).subscribe(order => console.log('Order created:', order));
  }

  submitOrder() {
    this.submitClick$.next();
  }
}`,
    metadata: {
      name: 'exhaustMap',
      category: 'Transformation',
      signature: 'exhaustMap<T, R>(project: (value: T, index: number) => ObservableInput<R>): OperatorFunction<T, R>',
      summary: 'Projects each source value to an Observable, ignoring new source values while the current inner Observable is running.',
      description: 'Ignores outer values while inner is busy. Ideal for submit/login debouncing.',
      difficulty: 'intermediate',
      useCases: ['Button double-click debounce', 'Login authentication trigger', 'Modal submission guard'],
      pitfalls: ['Permanent lockout if inner stream fails to complete', 'Drops data if applied to continuous feeds'],
      marbleRules: ['Locks on first emission', 'Drops all emissions until active finishes', 'Unlocks upon completion'],
      relatedOperators: ['switchMap', 'concatMap', 'mergeMap', 'exhaustAll'],
      docUrl: 'https://rxjs.dev/api/operators/exhaustMap'
    },
    comparison: MODULE4_MASTER_COMPARISON,
    quiz: [
      {
        id: 'em-q1',
        question: 'How does exhaustMap handle outer emissions that arrive while an inner observable is currently active?',
        options: [
          { id: 'a', text: 'It cancels the active inner observable and starts the new one' },
          { id: 'b', text: 'It queues the outer emissions in a FIFO buffer' },
          { id: 'c', text: 'It drops/ignores the incoming emissions entirely without queuing or starting them' },
          { id: 'd', text: 'It merges them into parallel streams' }
        ],
        correctOptionId: 'c',
        explanation: 'exhaustMap drops any new outer emission immediately while an inner observable is in flight (F36.4). No queue is created and no cancellation takes place.'
      },
      {
        id: 'em-q2',
        question: 'What dangerous edge case occurs if an inner observable in exhaustMap never completes?',
        options: [
          { id: 'a', text: 'It leaks memory by infinite queue expansion' },
          { id: 'b', text: 'It permanently locks out all future outer emissions forever (F36.B3)' },
          { id: 'c', text: 'RxJS automatically force-completes the inner stream after 5 seconds' },
          { id: 'd', text: 'It switches automatically to concatMap mode' }
        ],
        correctOptionId: 'b',
        explanation: 'Because exhaustMap only unlocks its gate upon receipt of a complete notification from the active inner observable, an uncompleted inner stream locks out all future emissions indefinitely.'
      },
      {
        id: 'em-q3',
        question: 'A user clicks a "Submit Payment" button 4 times in rapid succession. Which requests will exhaustMap execute if each call takes 1000ms?',
        options: [
          { id: 'a', text: 'All 4 requests sequentially' },
          { id: 'b', text: 'Only the 4th (latest) request' },
          { id: 'c', text: 'Only the 1st request; requests 2, 3, and 4 are dropped' },
          { id: 'd', text: 'None, because rapid clicking triggers a debounce error' }
        ],
        correctOptionId: 'c',
        explanation: 'Request 1 activates and locks the gate. Requests 2, 3, and 4 arrive while request 1 is still processing, so all three are completely ignored. Only request 1 executes.'
      },
      {
        id: 'em-q4',
        question: 'Why is exhaustMap preferred over debounceTime for transactional button clicks (like purchasing or submitting an invoice)?',
        options: [
          { id: 'a', text: 'exhaustMap executes immediately on the first click without waiting for an artificial debounce delay, then guards until the server finishes' },
          { id: 'b', text: 'debounceTime cannot be used with HTTP requests' },
          { id: 'c', text: 'exhaustMap caches previous payments' },
          { id: 'd', text: 'debounceTime drops errors from the server' }
        ],
        correctOptionId: 'a',
        explanation: 'debounceTime delays execution until user clicking ceases. exhaustMap executes the first click instantly, providing zero perceptible latency while protecting against repeated clicks until the transaction completes.'
      }
    ]
  }
};
