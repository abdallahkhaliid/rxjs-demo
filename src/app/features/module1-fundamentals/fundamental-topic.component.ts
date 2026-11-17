import { Component, inject, signal, computed, DestroyRef, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, interval, Subject, Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

import { ConsoleEntry, ConsoleEntryType, PlaygroundTab } from '../../core/models';
import { PlaygroundWrapperComponent } from '../../shared/components/playground-wrapper/playground-wrapper.component';
import { CodeBlockComponent } from '../../shared/components/code-block/code-block.component';
import { OutputConsoleComponent } from '../../shared/components/output-console/output-console.component';
import { ComparisonTableComponent } from '../../shared/components/comparison-table/comparison-table.component';
import { QuizBlockComponent } from '../../shared/components/quiz-block/quiz-block.component';
import { MODULE1_TOPICS, FundamentalTopicData } from './module1.data';

@Component({
  selector: 'app-fundamental-topic',
  standalone: true,
  imports: [
    PlaygroundWrapperComponent,
    CodeBlockComponent,
    OutputConsoleComponent,
    ComparisonTableComponent,
    QuizBlockComponent
  ],
  templateUrl: './fundamental-topic.component.html',
  styleUrl: './fundamental-topic.component.scss'
})
export class FundamentalTopicComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly topicId = signal<string>('what-is-rxjs');
  readonly activeTab = signal<PlaygroundTab>('concept');
  readonly consoleEntries = signal<ConsoleEntry[]>([])

  readonly topic = computed<FundamentalTopicData | null>(() => {
    return MODULE1_TOPICS[this.topicId()] || MODULE1_TOPICS['what-is-rxjs'] || null;
  });

  private startTimestamp = Date.now();
  private entryIdCounter = 0;

  // --- Topic 1 State (what-is-rxjs) ---
  readonly pullCount = signal<number>(0);
  readonly pushCount = signal<number>(0);
  readonly isPushing = signal<boolean>(false);
  private pushTimerId: any = null;

  // --- Topic 2 State (what-is-observable) ---
  readonly blueprintCreated = signal<boolean>(false);
  readonly subAActive = signal<boolean>(false);
  readonly subBActive = signal<boolean>(false);
  readonly subAVal = signal<string | null>(null);
  readonly subBVal = signal<string | null>(null);
  private subASub: Subscription | null = null;
  private subBSub: Subscription | null = null;
  private customObservable$: Observable<string> | null = null;
  private activeSubscribers: any[] = [];

  // --- Topic 3 State (observable-vs-promise) ---
  readonly promiseRunning = signal<boolean>(false);
  readonly promiseResolved = signal<boolean>(false);
  readonly promiseState = signal<string>('Idle');
  private activePromiseTimeout: any = null;

  readonly obsRunning = signal<boolean>(false);
  readonly obsCancelled = signal<boolean>(false);
  readonly obsTick = signal<number>(5);
  private obsSubscription: Subscription | null = null;

  // --- Topic 4 State (observer-subscriber) ---
  readonly streamTerminated = signal<boolean>(false);
  readonly simulateExceptionInNext = signal<boolean>(false);
  private safeValueSeq = 0;

  // --- Topic 5 State (subscription-lifecycle) ---
  readonly treeParentActive = signal<boolean>(false);
  readonly treeChild1Active = signal<boolean>(false);
  readonly treeChild2Active = signal<boolean>(false);
  readonly treeChild3Active = signal<boolean>(false);
  private compositeParentSub = new Subscription();
  private childSub1: Subscription | null = null;
  private childSub2: Subscription | null = null;
  private childSub3: Subscription | null = null;

  // --- Topic 6 State (cold-vs-hot) ---
  readonly viewer1Frame = signal<number>(0);
  readonly viewer2Frame = signal<number>(0);
  readonly viewer1Running = signal<boolean>(false);
  readonly viewer2Running = signal<boolean>(false);
  private viewer1Sub: Subscription | null = null;
  private viewer2Sub: Subscription | null = null;

  readonly liveBroadcastTick = signal<number>(0);
  readonly listener3Tick = signal<number | null>(null);
  readonly listener4Tick = signal<number | null>(null);
  readonly listener3Active = signal<boolean>(false);
  readonly listener4Active = signal<boolean>(false);
  private broadcastInterval: any = null;
  private hotBroadcast$ = new Subject<number>();
  private listener3Sub: Subscription | null = null;
  private listener4Sub: Subscription | null = null;

  // --- Topic 7 State (multicasting) ---
  readonly multicastMode = signal<'unicast' | 'multicast'>('multicast');
  readonly networkCalls = signal<number>(0);
  readonly activeConsumers = signal<string[]>([]);
  readonly activeConsumersCount = computed(() => this.activeConsumers().length);
  readonly bandwidthSaved = computed(() => {
    const consumers = this.activeConsumersCount();
    const calls = this.networkCalls();
    if (consumers <= 1 || calls === 0) return 0;
    return Math.max(0, Math.round(((consumers - calls) / consumers) * 100));
  });
  private cachedProfile$: Observable<any> | null = null;
  private sharedSubscriptions: Subscription[] = [];

  constructor() {
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(data => {
      const id = data['topicId'];
      if (id && id !== this.topicId()) {
        this.resetDemos();
        this.topicId.set(id);
      }
    });
  }

  ngOnInit(): void {
    const snapshotId = this.route.snapshot.data['topicId'];
    if (snapshotId) {
      this.topicId.set(snapshotId);
    }
  }

  ngOnDestroy(): void {
    this.cleanupAll();
  }

  // --- Console Logging Helper ---
  addLog(type: ConsoleEntryType, streamName?: string, value?: any, description?: string): void {
    const entry: ConsoleEntry = {
      id: `m1_entry_${++this.entryIdCounter}`,
      timestamp: Date.now(),
      relativeMs: Date.now() - this.startTimestamp,
      type,
      streamName,
      value,
      description
    };
    this.consoleEntries.update(entries => [...entries, entry]);
  }

  clearConsole(): void {
    this.consoleEntries.set([]);
    this.startTimestamp = Date.now();
  }

  private resetDemos(): void {
    this.cleanupAll();
    this.clearConsole();
    this.pullCount.set(0);
    this.pushCount.set(0);
    this.isPushing.set(false);
    this.blueprintCreated.set(false);
    this.subAActive.set(false);
    this.subBActive.set(false);
    this.subAVal.set(null);
    this.subBVal.set(null);
    this.promiseRunning.set(false);
    this.promiseResolved.set(false);
    this.promiseState.set('Idle');
    this.obsRunning.set(false);
    this.obsCancelled.set(false);
    this.obsTick.set(5);
    this.streamTerminated.set(false);
    this.simulateExceptionInNext.set(false);
    this.treeParentActive.set(false);
    this.treeChild1Active.set(false);
    this.treeChild2Active.set(false);
    this.treeChild3Active.set(false);
    this.viewer1Frame.set(0);
    this.viewer2Frame.set(0);
    this.viewer1Running.set(false);
    this.viewer2Running.set(false);
    this.listener3Tick.set(null);
    this.listener4Tick.set(null);
    this.listener3Active.set(false);
    this.listener4Active.set(false);
    this.networkCalls.set(0);
    this.activeConsumers.set([]);
  }

  private cleanupAll(): void {
    if (this.pushTimerId) {
      clearInterval(this.pushTimerId);
      this.pushTimerId = null;
    }
    if (this.subASub) {
      this.subASub.unsubscribe();
      this.subASub = null;
    }
    if (this.subBSub) {
      this.subBSub.unsubscribe();
      this.subBSub = null;
    }
    if (this.activePromiseTimeout) {
      clearTimeout(this.activePromiseTimeout);
      this.activePromiseTimeout = null;
    }
    if (this.obsSubscription) {
      this.obsSubscription.unsubscribe();
      this.obsSubscription = null;
    }
    if (this.compositeParentSub && !this.compositeParentSub.closed) {
      this.compositeParentSub.unsubscribe();
    }
    if (this.viewer1Sub) {
      this.viewer1Sub.unsubscribe();
      this.viewer1Sub = null;
    }
    if (this.viewer2Sub) {
      this.viewer2Sub.unsubscribe();
      this.viewer2Sub = null;
    }
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
    }
    if (this.listener3Sub) {
      this.listener3Sub.unsubscribe();
      this.listener3Sub = null;
    }
    if (this.listener4Sub) {
      this.listener4Sub.unsubscribe();
      this.listener4Sub = null;
    }
    for (const sub of this.sharedSubscriptions) {
      sub.unsubscribe();
    }
    this.sharedSubscriptions = [];
  }

  // ==========================================
  // TOPIC 1: what-is-rxjs
  // ==========================================
  simulatePull(): void {
    const nextVal = this.pullCount() + 1;
    this.pullCount.set(nextVal);
    this.addLog('next', 'PULL-CONSUMER', `Item #${nextVal}`, 'Consumer pulled data synchronously on demand');
  }

  startPushStream(): void {
    if (this.isPushing()) return;
    this.isPushing.set(true);
    this.addLog('subscribe', 'PUSH-PRODUCER', undefined, 'Producer push stream initiated (Interval: 1000ms)');

    this.pushTimerId = setInterval(() => {
      const nextCount = this.pushCount() + 1;
      this.pushCount.set(nextCount);
      const simulatedCpu = Math.floor(20 + Math.random() * 60);
      this.addLog('next', 'PUSH-PRODUCER', `Payload #${nextCount} (CPU: ${simulatedCpu}%)`, 'Producer pushed value reactively');
    }, 1000);
  }

  stopPushStream(): void {
    if (!this.isPushing()) return;
    clearInterval(this.pushTimerId);
    this.pushTimerId = null;
    this.isPushing.set(false);
    this.addLog('complete', 'PUSH-PRODUCER', undefined, 'Push producer finished and closed stream');
  }

  // ==========================================
  // TOPIC 2: what-is-observable
  // ==========================================
  createBlueprint(): void {
    this.blueprintCreated.set(true);
    this.activeSubscribers = [];
    this.customObservable$ = new Observable<string>(subscriber => {
      this.activeSubscribers.push(subscriber);
      let tick = 0;
      const intervalId = setInterval(() => {
        tick++;
        subscriber.next(`Tick #${tick}`);
      }, 800);

      return () => {
        clearInterval(intervalId);
        const idx = this.activeSubscribers.indexOf(subscriber);
        if (idx !== -1) this.activeSubscribers.splice(idx, 1);
      };
    });

    this.addLog('info', 'BLUEPRINT', 'const stream$ = new Observable(...)', 'Blueprint created! Notice: 0 emissions generated until subscribe()');
  }

  subscribeA(): void {
    if (!this.customObservable$) this.createBlueprint();
    this.subAActive.set(true);
    this.addLog('subscribe', 'OBSERVER-A', undefined, 'Observer A subscribed. Execution begins!');

    this.subASub = this.customObservable$!.subscribe({
      next: val => {
        this.subAVal.set(val);
        this.addLog('next', 'OBSERVER-A', val);
      },
      error: err => {
        this.subAActive.set(false);
        this.addLog('error', 'OBSERVER-A', err.message || err);
      },
      complete: () => {
        this.subAActive.set(false);
        this.addLog('complete', 'OBSERVER-A');
      }
    });
  }

  subscribeB(): void {
    if (!this.customObservable$) this.createBlueprint();
    this.subBActive.set(true);
    this.addLog('subscribe', 'OBSERVER-B', undefined, 'Observer B subscribed late! Notice: starts tick 1 independently (unicast)');

    this.subBSub = this.customObservable$!.subscribe({
      next: val => {
        this.subBVal.set(val);
        this.addLog('next', 'OBSERVER-B', val);
      },
      error: err => {
        this.subBActive.set(false);
        this.addLog('error', 'OBSERVER-B', err.message || err);
      },
      complete: () => {
        this.subBActive.set(false);
        this.addLog('complete', 'OBSERVER-B');
      }
    });
  }

  unsubscribeA(): void {
    if (this.subASub) {
      this.subASub.unsubscribe();
      this.subASub = null;
      this.subAActive.set(false);
      this.addLog('unsubscribe', 'OBSERVER-A', undefined, 'Observer A unsubscribed. Teardown executed for A.');
    }
  }

  unsubscribeB(): void {
    if (this.subBSub) {
      this.subBSub.unsubscribe();
      this.subBSub = null;
      this.subBActive.set(false);
      this.addLog('unsubscribe', 'OBSERVER-B', undefined, 'Observer B unsubscribed. Teardown executed for B.');
    }
  }

  triggerProducerError(): void {
    this.addLog('info', 'PRODUCER', undefined, 'Producer encountered fatal network drop!');
    for (const sub of [...this.activeSubscribers]) {
      sub.error(new Error('Fatal Stream Error (Network Drop)'));
    }
  }

  // ==========================================
  // TOPIC 3: observable-vs-promise
  // ==========================================
  startPromiseDemo(): void {
    this.promiseRunning.set(true);
    this.promiseResolved.set(false);
    this.promiseState.set('Running (3s)');
    this.addLog('info', 'PROMISE', undefined, 'Promise constructor invoked: executor begins immediately (Eager)');

    this.activePromiseTimeout = setTimeout(() => {
      this.promiseRunning.set(false);
      this.promiseResolved.set(true);
      this.promiseState.set('Resolved (Payload: 42)');
      this.addLog('next', 'PROMISE', { data: 42 }, 'Promise resolved 1 single value asynchronously');
    }, 3000);
  }

  tryCancelPromise(): void {
    this.addLog('info', 'PROMISE', undefined, 'Attempted to cancel Promise: Native Promises DO NOT support cancellation! Executor will still finish.');
  }

  startObservableDemo(): void {
    if (this.obsSubscription) {
      this.obsSubscription.unsubscribe();
    }
    this.obsRunning.set(true);
    this.obsCancelled.set(false);
    this.obsTick.set(5);
    this.addLog('subscribe', 'OBSERVABLE', undefined, 'Observable subscribed: countdown begins (Lazy & Cancellable)');

    const countdown$ = new Observable<number>(subscriber => {
      let count = 5;
      const intervalId = setInterval(() => {
        subscriber.next(count);
        count--;
        if (count < 0) {
          clearInterval(intervalId);
          subscriber.complete();
        }
      }, 1000);

      return () => {
        clearInterval(intervalId);
        this.addLog('unsubscribe', 'OBSERVABLE', undefined, 'Teardown logic: cleared countdown timer immediately upon unsubscription!');
      };
    });

    this.obsSubscription = countdown$.subscribe({
      next: val => {
        this.obsTick.set(val);
        this.addLog('next', 'OBSERVABLE', `Tick #${val}`);
      },
      complete: () => {
        this.obsRunning.set(false);
        this.addLog('complete', 'OBSERVABLE', undefined, 'Observable completed naturally');
      }
    });
  }

  cancelObservableDemo(): void {
    if (this.obsSubscription) {
      this.obsSubscription.unsubscribe();
      this.obsSubscription = null;
      this.obsRunning.set(false);
      this.obsCancelled.set(true);
      this.addLog('info', 'OBSERVABLE', undefined, 'Observable cancelled mid-stream via .unsubscribe()!');
    }
  }

  // ==========================================
  // TOPIC 4: observer-subscriber
  // ==========================================
  safeEmitNext(): void {
    if (this.streamTerminated()) {
      this.addLog('info', 'SAFE-SUBSCRIBER', undefined, 'SafeSubscriber BLOCKED illegal next() call after stream was terminated!');
      return;
    }

    if (this.simulateExceptionInNext()) {
      this.addLog('info', 'USER-CODE', undefined, 'User next() callback threw uncaught exception: Error("UI Rendering Crash")');
      this.streamTerminated.set(true);
      this.addLog('error', 'SAFE-SUBSCRIBER', 'Error: UI Rendering Crash', 'SafeSubscriber caught user exception, routed to error(), and unsubscribed');
      return;
    }

    this.safeValueSeq++;
    this.addLog('next', 'SAFE-SUBSCRIBER', `Value #${this.safeValueSeq}`, 'SafeSubscriber safely delivered value to observer');
  }

  safeEmitComplete(): void {
    this.streamTerminated.set(true);
    this.addLog('complete', 'SAFE-SUBSCRIBER', undefined, 'SafeSubscriber marked stream as complete and executed teardown');
  }

  safeEmitError(): void {
    this.streamTerminated.set(true);
    this.addLog('error', 'SAFE-SUBSCRIBER', 'Error("Fatal Stream Exception")', 'SafeSubscriber marked stream as errored and executed teardown');
  }

  resetSafeStream(): void {
    this.streamTerminated.set(false);
    this.safeValueSeq = 0;
    this.addLog('info', 'SAFE-SUBSCRIBER', undefined, 'Stream channel reset to active');
  }

  toggleExceptionInNext(): void {
    this.simulateExceptionInNext.update(v => !v);
  }

  // ==========================================
  // TOPIC 5: subscription-lifecycle
  // ==========================================
  initSubscriptionTree(): void {
    this.compositeParentSub = new Subscription();
    this.treeParentActive.set(true);
    this.treeChild1Active.set(true);
    this.treeChild2Active.set(true);
    this.treeChild3Active.set(true);

    this.addLog('subscribe', 'PARENT-SUB', undefined, 'Initialized composite parent subscription');

    // Child 1: Telemetry
    this.childSub1 = interval(600).subscribe(t => {
      this.addLog('next', 'CHILD-1 (Telemetry)', `Ping #${t}`);
    });
    this.compositeParentSub.add(this.childSub1);

    // Child 2: Heartbeat
    this.childSub2 = interval(1200).subscribe(t => {
      this.addLog('next', 'CHILD-2 (Heartbeat)', `Pulse #${t}`);
    });
    this.compositeParentSub.add(this.childSub2);

    // Child 3: Custom teardown
    this.childSub3 = new Subscription(() => {
      this.addLog('unsubscribe', 'CHILD-3 (DOM Resize)', undefined, 'DOM Resize listener detached');
    });
    this.compositeParentSub.add(this.childSub3);

    this.addLog('info', 'PARENT-SUB', undefined, 'Added 3 child subscriptions to composite parent via sub.add()');
  }

  unsubscribeChild2Only(): void {
    if (this.childSub2) {
      this.childSub2.unsubscribe();
      this.childSub2 = null;
      this.treeChild2Active.set(false);
      this.addLog('unsubscribe', 'CHILD-2 (Heartbeat)', undefined, 'Only Child 2 unsubscribed. Parent and Children 1 & 3 remain active.');
    }
  }

  unsubscribeParentTree(): void {
    if (this.compositeParentSub) {
      this.compositeParentSub.unsubscribe();
      this.treeParentActive.set(false);
      this.treeChild1Active.set(false);
      this.treeChild2Active.set(false);
      this.treeChild3Active.set(false);
      this.addLog('unsubscribe', 'PARENT-SUB', undefined, 'Parent unsubscribed! Cascaded unsubscription to all children and executed teardown tree.');
    }
  }

  // ==========================================
  // TOPIC 6: cold-vs-hot
  // ==========================================
  startViewer1(): void {
    this.viewer1Running.set(true);
    this.viewer1Frame.set(0);
    this.addLog('subscribe', 'COLD-VIEWER-1', undefined, 'Viewer 1 pressed play: starts movie on-demand from Frame 1');

    this.viewer1Sub = interval(500).subscribe(t => {
      this.viewer1Frame.set(t + 1);
      this.addLog('next', 'COLD-VIEWER-1', `Frame #${t + 1}`);
    });
  }

  startViewer2(): void {
    this.viewer2Running.set(true);
    this.viewer2Frame.set(0);
    this.addLog('subscribe', 'COLD-VIEWER-2', undefined, 'Viewer 2 pressed play LATE: starts movie independently from Frame 1 (Unicast)!');

    this.viewer2Sub = interval(500).subscribe(t => {
      this.viewer2Frame.set(t + 1);
      this.addLog('next', 'COLD-VIEWER-2', `Frame #${t + 1}`);
    });
  }

  stopColdViewers(): void {
    if (this.viewer1Sub) {
      this.viewer1Sub.unsubscribe();
      this.viewer1Sub = null;
    }
    if (this.viewer2Sub) {
      this.viewer2Sub.unsubscribe();
      this.viewer2Sub = null;
    }
    this.viewer1Running.set(false);
    this.viewer2Running.set(false);
    this.addLog('unsubscribe', 'COLD-VIEWERS', undefined, 'Stopped all on-demand cold viewers');
  }

  private ensureHotBroadcast(): void {
    if (!this.broadcastInterval) {
      this.broadcastInterval = setInterval(() => {
        const next = this.liveBroadcastTick() + 1;
        this.liveBroadcastTick.set(next);
        this.hotBroadcast$.next(next);
      }, 700);
    }
  }

  tuneInListener3(): void {
    this.ensureHotBroadcast();
    this.listener3Active.set(true);
    this.addLog('subscribe', 'HOT-LISTENER-3', undefined, `Listener 3 tuned into live broadcast at tick #${this.liveBroadcastTick()}`);

    this.listener3Sub = this.hotBroadcast$.subscribe(tick => {
      this.listener3Tick.set(tick);
      this.addLog('next', 'HOT-LISTENER-3', `Radio Broadcast #${tick}`);
    });
  }

  tuneInListener4(): void {
    this.ensureHotBroadcast();
    this.listener4Active.set(true);
    const current = this.liveBroadcastTick();
    this.addLog('subscribe', 'HOT-LISTENER-4', undefined, `Listener 4 tuned in LATE at tick #${current}: missed all prior ticks completely!`);

    this.listener4Sub = this.hotBroadcast$.subscribe(tick => {
      this.listener4Tick.set(tick);
      this.addLog('next', 'HOT-LISTENER-4', `Radio Broadcast #${tick}`);
    });
  }

  disconnectListeners(): void {
    if (this.listener3Sub) {
      this.listener3Sub.unsubscribe();
      this.listener3Sub = null;
    }
    if (this.listener4Sub) {
      this.listener4Sub.unsubscribe();
      this.listener4Sub = null;
    }
    this.listener3Active.set(false);
    this.listener4Active.set(false);
    this.addLog('unsubscribe', 'HOT-LISTENERS', undefined, 'Listeners disconnected from live radio broadcast');
  }

  // ==========================================
  // TOPIC 7: multicasting
  // ==========================================
  setMulticastMode(mode: 'unicast' | 'multicast'): void {
    this.multicastMode.set(mode);
    this.unmountAllComponents();
    this.cachedProfile$ = null;
    this.addLog('info', 'MULTICAST-CONFIG', undefined, `Switched multicasting mode to: ${mode}`);
  }

  mountComponent(name: string): void {
    this.activeConsumers.update(list => [...list, name]);

    if (this.multicastMode() === 'unicast') {
      // Unshared: each subscriber makes a new HTTP request
      this.networkCalls.update(c => c + 1);
      const callNum = this.networkCalls();
      this.addLog('info', `HTTP-REQ #${callNum}`, undefined, `>>> Executing duplicate HTTP fetch for [${name}] <<<`);

      const unshared$ = new Observable<any>(subscriber => {
        setTimeout(() => {
          subscriber.next({ userId: 101, username: 'rx_admin', role: 'Administrator' });
          subscriber.complete();
        }, 300);
      });

      const sub = unshared$.subscribe(data => {
        this.addLog('next', name, data, `Received profile data via dedicated network call #${callNum}`);
      });
      this.sharedSubscriptions.push(sub);
    } else {
      // Multicast: shareReplay({ bufferSize: 1, refCount: true })
      if (!this.cachedProfile$) {
        this.networkCalls.update(c => c + 1);
        this.addLog('info', 'HTTP-REQ #1', undefined, '>>> Executing SINGLE HTTP fetch (Shared via shareReplay) <<<');

        const coldHttp$ = new Observable<any>(subscriber => {
          setTimeout(() => {
            subscriber.next({ userId: 101, username: 'rx_admin', role: 'Administrator' });
            subscriber.complete();
          }, 300);
        });

        this.cachedProfile$ = coldHttp$.pipe(
          shareReplay({ bufferSize: 1, refCount: true })
        );
      } else {
        this.addLog('info', name, undefined, `⚡ Cache hit! [${name}] retrieved shared data instantly with 0 HTTP calls.`);
      }

      const sub = this.cachedProfile$.subscribe(data => {
        this.addLog('next', name, data, 'Received shared cached response');
      });
      this.sharedSubscriptions.push(sub);
    }
  }

  unmountAllComponents(): void {
    for (const sub of this.sharedSubscriptions) {
      sub.unsubscribe();
    }
    this.sharedSubscriptions = [];
    this.activeConsumers.set([]);
    this.cachedProfile$ = null;
    this.addLog('unsubscribe', 'ALL-COMPONENTS', undefined, 'All consumers unmounted. refCount reached 0, cleaned up resources.');
  }
}
