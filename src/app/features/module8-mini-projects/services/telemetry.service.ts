import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, combineLatest, interval, EMPTY } from 'rxjs';
import { map, scan, shareReplay, switchMap } from 'rxjs/operators';
import { AlertStatus, TelemetryPoint } from '../module8.models';

export function sanitizeMetric(val: unknown): number {
  const n = Number(val);
  if (isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

export function evaluateAlert(point: { cpu: number; mem: number }): AlertStatus {
  if (point.cpu > 75) return 'CRITICAL_CPU';
  if (point.mem > 85) return 'CRITICAL_MEM';
  return 'NORMAL';
}

@Injectable({
  providedIn: 'root'
})
export class TelemetryService {
  private readonly isPlaying$ = new BehaviorSubject<boolean>(true);
  private readonly speedMs$ = new BehaviorSubject<number>(1000);

  // Individual metric subjects with realistic baseline initial values
  readonly cpu$ = new BehaviorSubject<number>(35);
  readonly mem$ = new BehaviorSubject<number>(45);
  readonly net$ = new BehaviorSubject<number>(120);

  // Manual trigger for testing/simulation
  readonly manualTick$ = new Subject<void>();

  // Gated ticker that halts emissions when paused
  private readonly activeTicker$ = combineLatest([this.isPlaying$, this.speedMs$]).pipe(
    switchMap(([playing, speed]) => (playing ? interval(Math.max(100, speed)) : EMPTY))
  );

  // Live telemetry stream combining metrics
  readonly currentPoint$: Observable<TelemetryPoint> = combineLatest([
    this.cpu$,
    this.mem$,
    this.net$
  ]).pipe(
    map(([rawCpu, rawMem, rawNet]) => {
      const cpu = sanitizeMetric(rawCpu);
      const mem = sanitizeMetric(rawMem);
      const net = isNaN(Number(rawNet)) ? 0 : Math.max(0, Math.round(Number(rawNet)));
      const alertStatus = evaluateAlert({ cpu, mem });
      const point: TelemetryPoint = {
        cpu,
        mem,
        net,
        timestamp: new Date().toISOString(),
        alertStatus
      };
      return point;
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  // Sliding 15-point window history
  readonly history$: Observable<TelemetryPoint[]> = this.currentPoint$.pipe(
    scan((history: TelemetryPoint[], point: TelemetryPoint) => {
      return [...history.slice(-14), point];
    }, []),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor() {
    // Generate fluctuating mock telemetry when active
    this.activeTicker$.subscribe(() => {
      this.generateFluctuation();
    });
  }

  private generateFluctuation(): void {
    const curCpu = this.cpu$.value;
    const curMem = this.mem$.value;
    const curNet = this.net$.value;

    // Random walk with drift toward normal baselines
    const nextCpu = Math.max(15, Math.min(95, curCpu + (Math.random() * 16 - 8)));
    const nextMem = Math.max(25, Math.min(95, curMem + (Math.random() * 8 - 4)));
    const nextNet = Math.max(50, Math.min(850, curNet + (Math.random() * 80 - 40)));

    this.cpu$.next(Math.round(nextCpu));
    this.mem$.next(Math.round(nextMem));
    this.net$.next(Math.round(nextNet));
  }

  togglePlay(): boolean {
    const next = !this.isPlaying$.value;
    this.isPlaying$.next(next);
    return next;
  }

  setPlay(play: boolean): void {
    this.isPlaying$.next(play);
  }

  get isPlaying(): boolean {
    return this.isPlaying$.value;
  }

  setSpeed(ms: number): void {
    this.speedMs$.next(Math.max(100, ms));
  }

  get speedMs(): number {
    return this.speedMs$.value;
  }

  injectSpike(metric: 'cpu' | 'mem' | 'net', value: number): void {
    if (metric === 'cpu') this.cpu$.next(value);
    else if (metric === 'mem') this.mem$.next(value);
    else if (metric === 'net') this.net$.next(value);
  }

  reset(): void {
    this.cpu$.next(35);
    this.mem$.next(45);
    this.net$.next(120);
  }
}
