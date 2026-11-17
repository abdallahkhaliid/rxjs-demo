import { Observable, of, Subject } from 'rxjs';
import {
  share,
  shareReplay,
  multicast,
  publish,
  refCount
} from 'rxjs/operators';
import { OperatorDefinition } from '../operator-catalog.models';

export const MULTICASTING_OPERATORS: Record<string, OperatorDefinition> = {
  share: {
    id: 'share',
    name: 'share',
    category: 'multicasting',
    categoryDisplayName: 'Multicasting',
    signature: 'share<T>(options?: ShareConfig<T>): OperatorFunction<T, T>',
    summary: 'Returns a new Observable that multicasts (shares) the original Observable as long as there is at least one subscriber.',
    description: 'Turns a cold, unicast Observable into a hot, shared multicast Observable. Multiple concurrent subscribers share a single underlying execution.',
    difficulty: 'intermediate',
    asciiMarble: {
      input:  '--1--2--3--|',
      operator: 'share()',
      output: '--1--2--3--| (shared by Sub 1 and Sub 2)'
    },
    defaultSourcePreset: 'sync_numbers',
    parameters: [],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [],
      description: 'Shares a single execution across all concurrent subscribers.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'producer$', emissions: [{ id: '1', timeMs: 200, value: 100, displayLabel: '100' }] }],
      outputStream: { id: 'out', label: 'share()', emissions: [{ id: 'o1', timeMs: 200, value: 100, displayLabel: '100' }] }
    },
    codeSnippet: `import { timer } from 'rxjs';
import { tap, map, share } from 'rxjs/operators';

let counter = 0;
const source$ = timer(500).pipe(
  tap(() => console.log('HTTP request executed #', ++counter)),
  map(() => 'User Profile Data'),
  share()
);

// Multiple subscribers share the single HTTP execution
source$.subscribe(data => console.log('Sub A:', data));
source$.subscribe(data => console.log('Sub B:', data));`,
    codeExample: `import { of } from 'rxjs';
import { tap, share } from 'rxjs/operators';

let runs = 0;
const shared$ = of(100).pipe(tap(() => runs++), share());
shared$.subscribe();
shared$.subscribe();`,
    comparison: {
      features: [
        { id: 'lateSubscriber', label: 'Late Subscriber Policy', description: 'What late arrivals receive' },
        { id: 'teardown', label: 'Teardown on Zero Subs', description: 'Disconnects when subscribers leave' }
      ],
      items: [
        { id: 'share', name: 'share', recommendedUse: 'Sharing ongoing hot streams among concurrent subscribers', characteristics: { lateSubscriber: { text: 'Only receives future emissions (no history)', status: 'neutral' }, teardown: { text: 'Automatically resets when subscriber count reaches 0', status: 'positive' } } },
        { id: 'shareReplay', name: 'shareReplay', recommendedUse: 'Caching HTTP requests and static state for late subscribers', characteristics: { lateSubscriber: { text: 'Replays buffered past emissions immediately', status: 'positive' }, teardown: { text: 'Configurable refCount teardown', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What happens to share() when its subscriber count drops to zero and a new subscriber arrives later?',
        options: [
          { id: 'A', text: 'It re-subscribes to the underlying cold source Observable' },
          { id: 'B', text: 'It throws an error' },
          { id: 'C', text: 'It refuses any new subscriptions' },
          { id: 'D', text: 'It replays cached data' }
        ],
        correctOptionId: 'A',
        explanation: 'share() automatically manages a reference count. When the count drops to 0, it disconnects, resetting so subsequent subscribers restart the source.'
      }
    ],
        useCases: [
      "Sharing a single cold Observable execution (e.g. expensive HTTP request or WebSocket connection) across multiple subscribers",
      "Preventing duplicate API calls when multiple UI components subscribe to the same data stream simultaneously",
      "Multicasting live real-time price updates from a single socket connection to multiple widgets"
    ],
    pitfalls: [
      "By default in RxJS 7, share() disconnects when subscriber count drops to 0; late subscribers arriving after zero will trigger a new subscription unless reset configuration is customized",
      "Subscribers that join after emissions have already occurred will miss past values (use shareReplay if late subscribers need past data)"
    ],
    relatedOperators: ["shareReplay","publish","multicast"],
    docUrl: "https://rxjs.dev/api/operators/share",
    metadata: {

      name: 'share',
      category: 'Multicasting',
      signature: 'share(): OperatorFunction<T, T>',
      summary: 'Shares single execution across concurrent subscribers.',
      description: 'Reference-counted multicast sharing operator.',
      difficulty: 'intermediate',
      useCases: [
        "Sharing a single cold Observable execution (e.g. expensive HTTP request or WebSocket connection) across multiple subscribers",
        "Preventing duplicate API calls when multiple UI components subscribe to the same data stream simultaneously",
        "Multicasting live real-time price updates from a single socket connection to multiple widgets"
      ],
      pitfalls: [
        "By default in RxJS 7, share() disconnects when subscriber count drops to 0; late subscribers arriving after zero will trigger a new subscription unless reset configuration is customized",
        "Subscribers that join after emissions have already occurred will miss past values (use shareReplay if late subscribers need past data)"
      ],
      relatedOperators: ["shareReplay","publish","multicast"],
      docUrl: "https://rxjs.dev/api/operators/share"
    },
    pipelineFactory: source$ => source$.pipe(share())
  },

  shareReplay: {
    id: 'shareReplay',
    name: 'shareReplay',
    category: 'multicasting',
    categoryDisplayName: 'Multicasting',
    signature: 'shareReplay<T>(configOrBufferSize?: number | ShareReplayConfig): OperatorFunction<T, T>',
    summary: 'Share source and replay specified number of emissions on subscription.',
    description: 'The standard caching pattern in Angular. Caches the last N emissions in a ReplaySubject and replays them to any late subscribers immediately upon subscription.',
    difficulty: 'intermediate',
    asciiMarble: {
      input:  '--1--2--|',
      operator: 'shareReplay(1)',
      output: '--1--2--| (Sub 2 subscribes later -> immediately receives 2)'
    },
    defaultSourcePreset: 'sync_numbers',
    parameters: [
      { id: 'bufferSize', name: 'Replay Buffer Size', type: 'number', defaultValue: 1, min: 1, max: 5 }
    ],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [{ id: 'bufferSize', name: 'Buffer Size', type: 'number', defaultValue: 1 }],
      description: 'Caches the last N emissions for subsequent late subscribers.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'http$', emissions: [{ id: '1', timeMs: 200, value: 'cached-data', displayLabel: 'cached' }] }],
      outputStream: { id: 'out', label: 'shareReplay(1)', emissions: [{ id: 'o1', timeMs: 200, value: 'cached-data', displayLabel: 'cached' }] }
    },
    codeSnippet: `import { HttpClient } from '@angular/common/http';
import { shareReplay } from 'rxjs/operators';

// Classic Angular HTTP caching service pattern:
export class UserService {
  readonly user$ = this.http.get('/api/me').pipe(
    shareReplay({ bufferSize: 1, refCount: true })
  );
}`,
    codeExample: `import { of } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

const cached$ = of('cached-data').pipe(shareReplay(1));
cached$.subscribe(console.log);`,
    comparison: {
      features: [{ id: 'caching', label: 'Caching Model', description: 'Replay buffer' }],
      items: [
        { id: 'shareReplay', name: 'shareReplay', recommendedUse: 'Caching HTTP GET responses across components', characteristics: { caching: { text: 'Buffers N items via ReplaySubject', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'Why is { bufferSize: 1, refCount: true } recommended for HTTP caching in shareReplay?',
        options: [
          { id: 'A', text: 'refCount: true ensures the cache is cleared and unsubscribed when no components are listening, preventing memory leaks' },
          { id: 'B', text: 'It makes HTTP requests faster' },
          { id: 'C', text: 'It prevents TypeScript errors' },
          { id: 'D', text: 'It is required by Angular router' }
        ],
        correctOptionId: 'A',
        explanation: 'Without refCount: true, shareReplay maintains an active subscription forever even after all components destroy.'
      }
    ],
        useCases: [
      "Caching HTTP GET request responses so late-subscribing components receive the cached result instantly without re-fetching",
      "Storing application configuration or authentication state in memory for on-demand component consumption",
      "Replaying the latest N telemetry events to new dashboard widgets as they mount"
    ],
    pitfalls: [
      "Always use { bufferSize: 1, refCount: true } in UI applications; omitting refCount: true keeps the source subscription alive forever even after all subscribers unsubscribe, leaking memory",
      "If the source errors and refCount is false, shareReplay will permanently cache and replay that error to all future subscribers"
    ],
    relatedOperators: ["share","publish","multicast"],
    docUrl: "https://rxjs.dev/api/operators/shareReplay",
    metadata: {

      name: 'shareReplay',
      category: 'Multicasting',
      signature: 'shareReplay(bufferSize): OperatorFunction<T, T>',
      summary: 'Shares source and replays buffer to late subscribers.',
      description: 'Caching multicast operator.',
      difficulty: 'intermediate',
      useCases: [
        "Caching HTTP GET request responses so late-subscribing components receive the cached result instantly without re-fetching",
        "Storing application configuration or authentication state in memory for on-demand component consumption",
        "Replaying the latest N telemetry events to new dashboard widgets as they mount"
      ],
      pitfalls: [
        "Always use { bufferSize: 1, refCount: true } in UI applications; omitting refCount: true keeps the source subscription alive forever even after all subscribers unsubscribe, leaking memory",
        "If the source errors and refCount is false, shareReplay will permanently cache and replay that error to all future subscribers"
      ],
      relatedOperators: ["share","publish","multicast"],
      docUrl: "https://rxjs.dev/api/operators/shareReplay"
    },
    pipelineFactory: (source$, params) => {
      const b = params['bufferSize'] ?? 1;
      return source$.pipe(shareReplay(b));
    }
  },

  multicast: {
    id: 'multicast',
    name: 'multicast',
    category: 'multicasting',
    categoryDisplayName: 'Multicasting',
    signature: 'multicast<T>(subjectOrSubjectFactory: Function | Subject<T>): OperatorFunction<T, T>',
    summary: 'Returns an Observable that emits items via a specified Subject.',
    description: 'Underlying primitive for multicasting in RxJS. Returns a ConnectableObservable that routes all source items through the provided Subject. Deprecated in RxJS 7 in favor of share/connectable.',
    difficulty: 'advanced',
    asciiMarble: {
      input:  '--1--2--3--|',
      operator: 'multicast(() => new Subject())',
      output: '--1--2--3--| (after .connect())'
    },
    defaultSourcePreset: 'sync_numbers',
    parameters: [],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [],
      description: 'Delegates multicasting through a user-specified Subject instance.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 200, value: 'val', displayLabel: 'val' }] }],
      outputStream: { id: 'out', label: 'multicast()', emissions: [{ id: 'o1', timeMs: 200, value: 'val', displayLabel: 'val' }] }
    },
    codeSnippet: `import { of, Subject } from 'rxjs';
import { multicast } from 'rxjs/operators';

const subject = new Subject();
const multicasted$ = of(1, 2, 3).pipe(
  multicast(() => subject)
);

multicasted$.subscribe(v => console.log('Sub:', v));
(multicasted$ as any).connect();`,
    codeExample: `import { of, Subject } from 'rxjs';
import { multicast } from 'rxjs/operators';

const s = new Subject();
const m$ = of(42).pipe(multicast(() => s));
(m$ as any).connect();`,
    comparison: {
      features: [{ id: 'modern', label: 'Modern Alternative', description: 'RxJS 7 replacement' }],
      items: [
        { id: 'multicast', name: 'multicast', recommendedUse: 'Legacy custom subject multicasting', characteristics: { modern: { text: 'connectable(source, { connector: () => new Subject() })', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What is returned by multicast() when called without a selector function?',
        options: [
          { id: 'A', text: 'A ConnectableObservable requiring an explicit .connect() call to begin execution' },
          { id: 'B', text: 'A Promise' },
          { id: 'C', text: 'A Subject' },
          { id: 'D', text: 'An array' }
        ],
        correctOptionId: 'A',
        explanation: 'multicast returns a ConnectableObservable that will not subscribe to the source until .connect() is invoked.'
      }
    ],
        useCases: [
      "Customizing the underlying Subject instance (e.g. using a ReplaySubject or BehaviorSubject) in legacy RxJS architectures",
      "Controlling multi-subscriber execution timing via ConnectableObservable .connect() in legacy codebases"
    ],
    pitfalls: [
      "Deprecated in RxJS 7. Use connectable() or share() with custom connector factories instead",
      "Requires manual invocation of .connect() on the returned ConnectableObservable to start source execution, which frequently causes silent bugs if forgotten"
    ],
    relatedOperators: ["publish","refCount","share"],
    docUrl: "https://rxjs.dev/api/operators/multicast",
    isDeprecated: true,
    deprecationNotice: "Deprecated in RxJS 7 in favor of connectable() or share() with custom connector factory.",
    modernAlternative: "connectable(source$, { connector: () => new Subject() })",
    metadata: {

      name: 'multicast',
      category: 'Multicasting',
      signature: 'multicast(subjectFactory): OperatorFunction<T, T>',
      summary: 'Emits items via a specified Subject.',
      description: 'Subject-driven multicasting.',
      difficulty: 'advanced',
      useCases: [
        "Customizing the underlying Subject instance (e.g. using a ReplaySubject or BehaviorSubject) in legacy RxJS architectures",
        "Controlling multi-subscriber execution timing via ConnectableObservable .connect() in legacy codebases"
      ],
      pitfalls: [
        "Deprecated in RxJS 7. Use connectable() or share() with custom connector factories instead",
        "Requires manual invocation of .connect() on the returned ConnectableObservable to start source execution, which frequently causes silent bugs if forgotten"
      ],
      relatedOperators: ["publish","refCount","share"],
      docUrl: "https://rxjs.dev/api/operators/multicast",
      isDeprecated: true,
      deprecationNotice: "Deprecated in RxJS 7 in favor of connectable() or share() with custom connector factory.",
      modernAlternative: "connectable(source$, { connector: () => new Subject() })"
    },
    pipelineFactory: source$ => {
      const subject = new Subject<any>();
      const connectable$ = source$.pipe(multicast(() => subject)) as any;
      setTimeout(() => connectable$.connect(), 0);
      return connectable$;
    }
  },

  publish: {
    id: 'publish',
    name: 'publish',
    category: 'multicasting',
    categoryDisplayName: 'Multicasting',
    signature: 'publish<T>(): OperatorFunction<T, T>',
    summary: 'Returns a ConnectableObservable, which is a variety of Observable that waits until its connect method is called before it begins emitting items.',
    description: 'Shorthand for multicast(() => new Subject()). Holds execution until explicit connect() is invoked. Deprecated in RxJS 7 in favor of connectable().',
    difficulty: 'advanced',
    asciiMarble: {
      input:  '--1--2--3--|',
      operator: 'publish() + .connect()',
      output: '--1--2--3--|'
    },
    defaultSourcePreset: 'sync_numbers',
    parameters: [],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [],
      description: 'Connectable multicasting waiting for explicit connect signal.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 200, value: 42, displayLabel: '42' }] }],
      outputStream: { id: 'out', label: 'publish()', emissions: [{ id: 'o1', timeMs: 200, value: 42, displayLabel: '42' }] }
    },
    codeSnippet: `import { interval } from 'rxjs';
import { publish, take } from 'rxjs/operators';

const connectable$ = interval(500).pipe(
  take(4),
  publish()
);

connectable$.subscribe(v => console.log('Sub 1:', v));
connectable$.subscribe(v => console.log('Sub 2:', v));

// Begin execution for all subscribers simultaneously:
(connectable$ as any).connect();`,
    codeExample: `import { of } from 'rxjs';
import { publish } from 'rxjs/operators';

const c$ = of(1, 2).pipe(publish()) as any;
c$.connect();`,
    comparison: {
      features: [{ id: 'trigger', label: 'Connection Trigger', description: 'When source starts' }],
      items: [
        { id: 'publish', name: 'publish', recommendedUse: 'Synchronizing multi-subscriber start times', characteristics: { trigger: { text: 'Manual .connect() call', status: 'positive' } } },
        { id: 'refCount', name: 'refCount', recommendedUse: 'Automating connection on first subscriber', characteristics: { trigger: { text: 'Automatic when subscriber count > 0', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'Does publish() subscribe to the source when a consumer subscribes?',
        options: [
          { id: 'A', text: 'No, it only subscribes when .connect() is called on the ConnectableObservable' },
          { id: 'B', text: 'Yes, immediately' },
          { id: 'C', text: 'Only after 1 second' },
          { id: 'D', text: 'Only on complete' }
        ],
        correctOptionId: 'A',
        explanation: 'publish isolates subscription: subscribers register with the internal Subject, and source subscription begins only upon connect().'
      }
    ],
        useCases: [
      "Converting a cold Observable into a ConnectableObservable to synchronize the start time across multiple subscribers in legacy systems",
      "Ensuring that all initial subscribers are registered before triggering a one-time streaming computation via .connect()"
    ],
    pitfalls: [
      "Deprecated in RxJS 7. Use connectable(source$) or share() instead",
      "Will not emit any values or execute upstream operations until .connect() is explicitly called"
    ],
    relatedOperators: ["multicast","refCount","share"],
    docUrl: "https://rxjs.dev/api/operators/publish",
    isDeprecated: true,
    deprecationNotice: "Deprecated in RxJS 7 in favor of connectable() or share().",
    modernAlternative: "connectable(source$)",
    metadata: {

      name: 'publish',
      category: 'Multicasting',
      signature: 'publish(): OperatorFunction<T, T>',
      summary: 'Returns ConnectableObservable waiting for connect().',
      description: 'Connectable multicast operator.',
      difficulty: 'advanced',
      useCases: [
        "Converting a cold Observable into a ConnectableObservable to synchronize the start time across multiple subscribers in legacy systems",
        "Ensuring that all initial subscribers are registered before triggering a one-time streaming computation via .connect()"
      ],
      pitfalls: [
        "Deprecated in RxJS 7. Use connectable(source$) or share() instead",
        "Will not emit any values or execute upstream operations until .connect() is explicitly called"
      ],
      relatedOperators: ["multicast","refCount","share"],
      docUrl: "https://rxjs.dev/api/operators/publish",
      isDeprecated: true,
      deprecationNotice: "Deprecated in RxJS 7 in favor of connectable() or share().",
      modernAlternative: "connectable(source$)"
    },
    pipelineFactory: source$ => {
      const conn$ = source$.pipe(publish()) as any;
      setTimeout(() => conn$.connect(), 0);
      return conn$;
    }
  },

  refCount: {
    id: 'refCount',
    name: 'refCount',
    category: 'multicasting',
    categoryDisplayName: 'Multicasting',
    signature: 'refCount(): MonoTypeOperatorFunction<T>',
    summary: 'Make a ConnectableObservable behave like a normal Observable and automate the connect() process based on subscriber count.',
    description: "Piped onto a ConnectableObservable (from publish() or multicast()). Connects to source on 1st subscriber, and automatically disconnects when subscriber count drops to zero. Deprecated in RxJS 7 in favor of share() with reset configuration or connectable().",
    difficulty: 'intermediate',
    asciiMarble: {
      input:  '--1--2--3--|',
      operator: 'publish().pipe(refCount())',
      output: '--1--2--3--| (auto connects/disconnects)'
    },
    defaultSourcePreset: 'sync_numbers',
    parameters: [],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [],
      description: 'Automatically connects when subscribers arrive and disconnects when zero remain.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 200, value: 1, displayLabel: '1' }] }],
      outputStream: { id: 'out', label: 'refCount()', emissions: [{ id: 'o1', timeMs: 200, value: 1, displayLabel: '1' }] }
    },
    codeSnippet: `import { interval } from 'rxjs';
import { publish, refCount, take } from 'rxjs/operators';

const automated$ = interval(500).pipe(
  take(5),
  publish(),
  refCount() // Connects when 1st sub joins, unsubscribes when last leaves
);

automated$.subscribe(console.log);`,
    codeExample: `import { of } from 'rxjs';
import { publish, refCount } from 'rxjs/operators';

of(1, 2, 3).pipe(publish(), refCount()).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'autoConnect', label: 'Automatic Connection', description: 'Manages connect()' }],
      items: [
        { id: 'refCount', name: 'refCount', recommendedUse: 'Automating ConnectableObservables without manual .connect()', characteristics: { autoConnect: { text: 'Automated by subscriber reference counting', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What is publish().pipe(refCount()) essentially equivalent to in modern RxJS?',
        options: [
          { id: 'A', text: 'share()' },
          { id: 'B', text: 'forkJoin()' },
          { id: 'C', text: 'merge()' },
          { id: 'D', text: 'take(1)' }
        ],
        correctOptionId: 'A',
        explanation: 'share() in RxJS is effectively multicast(() => new Subject()).pipe(refCount()).'
      }
    ],
        useCases: [
      "Automating connect() and disconnect() on a ConnectableObservable based on subscriber count in legacy RxJS 6 applications",
      "Automatically establishing upstream subscription on 1st subscriber and tearing down when subscriber count reaches 0"
    ],
    pitfalls: [
      "Deprecated in RxJS 7 in favor of share() with reset configuration or connectable(). Piped connectable refCounting is superseded by share()",
      "When subscriber count drops to zero, the source is unsubscribed; subsequent subscribers trigger a fresh resubscription unless caching is configured"
    ],
    relatedOperators: ["share","publish","multicast"],
    docUrl: "https://rxjs.dev/api/operators/refCount",
    isDeprecated: true,
    deprecationNotice: "Deprecated in RxJS 7 in favor of share() with reset configuration or connectable(). Manual piped refCount() is superseded.",
    modernAlternative: "share()",
    metadata: {

      name: 'refCount',
      category: 'Multicasting',
      signature: 'refCount(): MonoTypeOperatorFunction<T>',
      summary: 'Automates connect() and disconnect based on subscriber count.',
      description: 'Reference counting connection automator.',
      difficulty: 'intermediate',
      useCases: [
        "Automating connect() and disconnect() on a ConnectableObservable based on subscriber count in legacy RxJS 6 applications",
        "Automatically establishing upstream subscription on 1st subscriber and tearing down when subscriber count reaches 0"
      ],
      pitfalls: [
        "Deprecated in RxJS 7 in favor of share() with reset configuration or connectable(). Piped connectable refCounting is superseded by share()",
        "When subscriber count drops to zero, the source is unsubscribed; subsequent subscribers trigger a fresh resubscription unless caching is configured"
      ],
      relatedOperators: ["share","publish","multicast"],
      docUrl: "https://rxjs.dev/api/operators/refCount",
      isDeprecated: true,
      deprecationNotice: "Deprecated in RxJS 7 in favor of share() with reset configuration or connectable(). Manual piped refCount() is superseded.",
      modernAlternative: "share()"
    },
    pipelineFactory: source$ => source$.pipe(publish(), refCount())
  }
};
