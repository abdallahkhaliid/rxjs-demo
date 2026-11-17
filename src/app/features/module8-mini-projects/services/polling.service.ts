import { Injectable, inject } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  Subject,
  fromEvent,
  merge,
  of,
  timer,
  EMPTY
} from 'rxjs';
import {
  catchError,
  debounceTime,
  map,
  retry,
  startWith,
  switchMap,
  takeUntil,
  tap
} from 'rxjs/operators';
import { LessonsService } from '../../../core/services/lessons.service';
import { PollResultItem, PollingEngineState } from '../module8.models';

export function sanitizePollingInterval(ms: unknown): number {
  const n = Number(ms);
  return isNaN(n) || n < 500 ? 500 : Math.round(n);
}

@Injectable({
  providedIn: 'root'
})
export class PollingService {
  private readonly lessonsService = inject(LessonsService);

  private readonly isRunning$ = new BehaviorSubject<boolean>(false);
  private readonly intervalMs$ = new BehaviorSubject<number>(2000);
  private readonly simulatedTabHidden$ = new BehaviorSubject<boolean>(false);
  private readonly simulatedError$ = new BehaviorSubject<boolean>(false);
  private readonly manualRefresh$ = new Subject<void>();
  private readonly stop$ = new Subject<void>();

  private pollCounter = 0;
  private retryCounter = 0;

  // Real or simulated tab visibility stream
  readonly isTabVisible$: Observable<boolean> = this.simulatedTabHidden$.pipe(
    switchMap(simulatedHidden => {
      if (simulatedHidden) {
        return of(false);
      }
      if (typeof document !== 'undefined') {
        return fromEvent(document, 'visibilitychange').pipe(
          map(() => document.visibilityState === 'visible'),
          startWith(document.visibilityState === 'visible')
        );
      }
      return of(true);
    })
  );

  private readonly stateSubject$ = new BehaviorSubject<PollingEngineState>({
    isRunning: false,
    isTabVisible: true,
    intervalMs: 2000,
    pollCount: 0,
    retryCount: 0,
    lastLatencyMs: 0,
    lastSuccessTimestamp: null,
    history: []
  });

  readonly state$: Observable<PollingEngineState> = this.stateSubject$.asObservable();

  constructor() {
    this.isTabVisible$.subscribe(visible => {
      this.updateState({ isTabVisible: visible });
    });
  }

  startPolling(): void {
    if (this.isRunning$.value) return;
    this.isRunning$.next(true);
    this.updateState({ isRunning: true });

    // Stream: when running & tab visible -> merge(periodicTimer, debouncedManualRefresh)
    this.isRunning$.pipe(
      switchMap(running => {
        if (!running) return EMPTY;
        return this.isTabVisible$.pipe(
          switchMap(visible => {
            if (!visible) return EMPTY; // Suspend polling when tab is hidden
            const intervalClamped = sanitizePollingInterval(this.intervalMs$.value);
            const periodic$ = timer(0, intervalClamped).pipe(map(() => 'periodic'));
            const manual$ = this.manualRefresh$.pipe(
              debounceTime(10),
              map(() => 'manual')
            );
            return merge(periodic$, manual$);
          })
        );
      }),
      switchMap(triggerType => {
        const start = Date.now();
        const pollId = ++this.pollCounter;

        if (this.simulatedError$.value) {
          return new Observable<PollResultItem>(observer => {
            observer.error(new Error('Simulated backend failure'));
          }).pipe(
            retry({
              count: 1,
              delay: () => {
                this.retryCounter++;
                this.updateState({ retryCount: this.retryCounter });
                return timer(100);
              }
            }),
            catchError(err => {
              const item: PollResultItem = {
                pollId,
                timestamp: new Date().toISOString(),
                durationMs: Date.now() - start,
                status: 'offline',
                attempt: 2,
                itemsCount: 0,
                error: err.message || 'Offline / Error'
              };
              return of(item);
            })
          );
        }

        return this.lessonsService.searchLessons('', undefined, 0, 5).pipe(
          retry({
            count: 1,
            delay: () => {
              this.retryCounter++;
              this.updateState({ retryCount: this.retryCounter });
              return timer(200);
            }
          }),
          map(response => {
            const item: PollResultItem = {
              pollId,
              timestamp: new Date().toISOString(),
              durationMs: Date.now() - start,
              status: 'ok',
              attempt: 1,
              itemsCount: response.lessons ? response.lessons.length : 0,
              snippet: response.lessons && response.lessons.length > 0
                ? response.lessons[0].description
                : 'No lessons returned'
            };
            return item;
          }),
          catchError(err => {
            const item: PollResultItem = {
              pollId,
              timestamp: new Date().toISOString(),
              durationMs: Date.now() - start,
              status: 'offline',
              attempt: 2,
              itemsCount: 0,
              error: err.message || 'Server unreachable'
            };
            return of(item);
          })
        );
      }),
      takeUntil(this.stop$)
    ).subscribe(result => {
      this.handlePollResult(result);
    });
  }

  stopPolling(): void {
    if (!this.isRunning$.value) return;
    this.isRunning$.next(false);
    this.stop$.next();
    this.updateState({ isRunning: false });
  }

  refreshNow(): void {
    this.manualRefresh$.next();
  }

  setInterval(ms: number): void {
    const clamped = sanitizePollingInterval(ms);
    this.intervalMs$.next(clamped);
    this.updateState({ intervalMs: clamped });
    // If currently running, restart stream to apply new timer interval immediately
    if (this.isRunning$.value) {
      this.stopPolling();
      this.startPolling();
    }
  }

  simulateTabHidden(hidden: boolean): void {
    this.simulatedTabHidden$.next(hidden);
  }

  simulateBackendError(error: boolean): void {
    this.simulatedError$.next(error);
  }

  private handlePollResult(result: PollResultItem): void {
    const currentState = this.stateSubject$.value;
    const nextHistory = [result, ...currentState.history.slice(0, 9)];
    this.updateState({
      pollCount: this.pollCounter,
      lastLatencyMs: result.durationMs,
      lastSuccessTimestamp: result.status === 'ok' ? result.timestamp : currentState.lastSuccessTimestamp,
      history: nextHistory
    });
  }

  private updateState(partial: Partial<PollingEngineState>): void {
    this.stateSubject$.next({
      ...this.stateSubject$.value,
      ...partial
    });
  }

  getState(): PollingEngineState {
    return this.stateSubject$.value;
  }
}
