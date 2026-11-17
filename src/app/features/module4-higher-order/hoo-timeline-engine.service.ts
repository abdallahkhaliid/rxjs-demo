import { Injectable, signal, computed, DestroyRef } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import {
  HooLifecycleState,
  HooOperatorType,
  HooTimelineRequest,
  HooTimelineOutputEmission,
  HooTimelineSnapshot
} from './module4.models';

export const REQUEST_COLORS = [
  '#6366f1', // Indigo (marble-1)
  '#06b6d4', // Cyan (marble-2)
  '#ec4899', // Pink (marble-3)
  '#f59e0b', // Amber (marble-4)
  '#10b981', // Emerald (marble-5)
  '#8b5cf6', // Purple (marble-6)
  '#3b82f6', // Blue (marble-7)
  '#14b8a6'  // Teal (marble-8)
];

@Injectable({
  providedIn: 'root'
})
export class HooTimelineEngineService {
  private requestsMap = new Map<number, HooTimelineRequest>();
  private outputList: HooTimelineOutputEmission[] = [];
  private nextId = 1;
  private currentOperator: HooOperatorType = 'switchMap';
  private concurrency = 1;
  private defaultDuration = 2000;
  private clockMs = 0;
  private timerIntervalId: any = null;

  // Signal for UI reactivity
  readonly snapshot = signal<HooTimelineSnapshot>(this.createSnapshot());

  // Compatibility getter for tests: tracker.requests[id]
  get requests(): Record<number | string, HooTimelineRequest> {
    const obj: Record<number | string, HooTimelineRequest> = {};
    for (const [id, req] of this.requestsMap.entries()) {
      obj[id] = req;
    }
    return obj;
  }

  constructor() {
    this.syncSnapshot();
  }

  setOperator(op: HooOperatorType): void {
    this.currentOperator = op;
    if (op === 'mergeMap') {
      if (this.concurrency <= 1) {
        this.concurrency = 2; // Default mergeMap to 2 concurrent
      }
    } else {
      this.concurrency = 1;
    }
    this.reset();
  }

  setConcurrencyLimit(limit: number): void {
    this.concurrency = Math.max(1, limit);
    this.checkQueue();
    this.syncSnapshot();
  }

  setDefaultDuration(ms: number): void {
    this.defaultDuration = Math.max(200, ms);
  }

  getOperator(): HooOperatorType {
    return this.currentOperator;
  }

  getConcurrencyLimit(): number {
    return this.concurrency;
  }

  trigger(labelOrId?: string | number, durationMs?: number, payload?: any, isBackendCall: boolean = false): HooTimelineRequest {
    let id: number;
    let label: string;

    if (typeof labelOrId === 'number') {
      id = labelOrId;
      label = `Req #${id}`;
      if (id >= this.nextId) {
        this.nextId = id + 1;
      }
    } else {
      id = this.nextId++;
      label = labelOrId || `Req #${id}`;
    }

    const duration = durationMs ?? this.defaultDuration;
    const color = REQUEST_COLORS[(id - 1) % REQUEST_COLORS.length];
    const emittedValue = payload !== undefined ? payload : `res-${id}`;

    const newReq: HooTimelineRequest = {
      id,
      label,
      state: 'queued',
      durationMs: duration,
      elapsedMs: 0,
      progress: 0,
      startTime: this.clockMs,
      emittedValue,
      color,
      isBackendCall
    };

    const activeList = this.getActiveRequests();

    switch (this.currentOperator) {
      case 'switchMap':
        // Cancel all currently active requests immediately
        for (const act of activeList) {
          act.state = 'cancelled';
          act.endTime = this.clockMs;
          act.cancelReason = `Superseded by Req #${id}`;
        }
        newReq.state = 'active';
        newReq.activeStartTime = this.clockMs;
        break;

      case 'concatMap':
        if (activeList.length > 0) {
          newReq.state = 'queued';
        } else {
          newReq.state = 'active';
          newReq.activeStartTime = this.clockMs;
        }
        break;

      case 'mergeMap':
        if (activeList.length < this.concurrency) {
          newReq.state = 'active';
          newReq.activeStartTime = this.clockMs;
        } else {
          newReq.state = 'queued';
        }
        break;

      case 'exhaustMap':
        if (activeList.length > 0) {
          newReq.state = 'ignored';
          newReq.endTime = this.clockMs;
          newReq.cancelReason = `Ignored: Active inner Req #${activeList[0].id} in flight`;
        } else {
          newReq.state = 'active';
          newReq.activeStartTime = this.clockMs;
        }
        break;
    }

    this.requestsMap.set(id, newReq);
    this.ensureSimulationRunning();
    this.syncSnapshot();
    return newReq;
  }

  triggerBurst(count: number = 3, durationMs?: number): HooTimelineRequest[] {
    const list: HooTimelineRequest[] = [];
    for (let i = 0; i < count; i++) {
      const id = this.nextId++;
      const req = this.trigger(`Burst #${id}`, durationMs, `burst-res-${id}`);
      list.push(req);
    }
    return list;
  }

  tick(deltaMs: number): void {
    this.clockMs += deltaMs;
    const activeList = this.getActiveRequests();

    for (const req of activeList) {
      req.elapsedMs += deltaMs;
      req.progress = Math.min(100, Math.round((req.elapsedMs / req.durationMs) * 100));

      if (req.elapsedMs >= req.durationMs) {
        this.complete(req.id);
      }
    }

    this.syncSnapshot();
  }

  complete(id: number | string): void {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    const req = this.requestsMap.get(numericId);
    if (!req || req.state !== 'active') return;

    req.state = 'completed';
    req.progress = 100;
    req.endTime = this.clockMs;

    this.outputList.push({
      id: `out-${req.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      requestId: req.id,
      timeMs: this.clockMs,
      value: req.emittedValue,
      displayLabel: String(req.emittedValue),
      color: req.color
    });

    this.checkQueue();
    this.syncSnapshot();
  }

  cancel(id: number | string, reason: string = 'Cancelled'): void {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    const req = this.requestsMap.get(numericId);
    if (!req || (req.state !== 'active' && req.state !== 'queued')) return;

    req.state = 'cancelled';
    req.endTime = this.clockMs;
    req.cancelReason = reason;

    this.checkQueue();
    this.syncSnapshot();
  }

  cancelAllActive(reason: string = 'Stream unsubscribed'): void {
    for (const req of this.requestsMap.values()) {
      if (req.state === 'active' || req.state === 'queued') {
        req.state = 'cancelled';
        req.endTime = this.clockMs;
        req.cancelReason = reason;
      }
    }
    this.stopSimulation();
    this.syncSnapshot();
  }

  reset(): void {
    this.stopSimulation();
    this.requestsMap.clear();
    this.outputList = [];
    this.nextId = 1;
    this.clockMs = 0;
    this.syncSnapshot();
  }

  getActiveRequests(): HooTimelineRequest[] {
    return Array.from(this.requestsMap.values()).filter(r => r.state === 'active');
  }

  getQueuedRequests(): HooTimelineRequest[] {
    return Array.from(this.requestsMap.values()).filter(r => r.state === 'queued');
  }

  private checkQueue(): void {
    if (this.currentOperator === 'switchMap' || this.currentOperator === 'exhaustMap') {
      return;
    }

    const activeCount = this.getActiveRequests().length;
    const limit = this.concurrency;
    const availableSlots = limit - activeCount;

    if (availableSlots > 0) {
      const queuedList = this.getQueuedRequests();
      const toActivate = queuedList.slice(0, availableSlots);

      for (const req of toActivate) {
        req.state = 'active';
        req.activeStartTime = this.clockMs;
      }
    }
  }

  private syncSnapshot(): void {
    this.snapshot.set(this.createSnapshot());
  }

  private createSnapshot(): HooTimelineSnapshot {
    const all = Array.from(this.requestsMap.values());
    const activeCount = all.filter(r => r.state === 'active').length;
    const queuedCount = all.filter(r => r.state === 'queued').length;
    const completedCount = all.filter(r => r.state === 'completed').length;
    const cancelledCount = all.filter(r => r.state === 'cancelled').length;
    const ignoredCount = all.filter(r => r.state === 'ignored').length;

    return {
      operator: this.currentOperator,
      concurrencyLimit: this.concurrency,
      requests: all,
      activeCount,
      queuedCount,
      completedCount,
      cancelledCount,
      ignoredCount,
      outputs: [...this.outputList],
      isRunning: activeCount > 0 || queuedCount > 0
    };
  }

  // Real-time animation loop
  startSimulation(stepMs: number = 50): void {
    if (this.timerIntervalId) return;
    this.timerIntervalId = setInterval(() => {
      const hasRunning = this.getActiveRequests().length > 0 || this.getQueuedRequests().length > 0;
      if (hasRunning) {
        this.tick(stepMs);
      } else {
        this.stopSimulation();
      }
    }, stepMs);
  }

  stopSimulation(): void {
    if (this.timerIntervalId) {
      clearInterval(this.timerIntervalId);
      this.timerIntervalId = null;
    }
  }

  private ensureSimulationRunning(): void {
    if (!this.timerIntervalId) {
      this.startSimulation(50);
    }
  }
}

/**
 * Pure class matching F36.5 specification for direct or unit test usage.
 */
export class TimelineStateTracker {
  strategy: HooOperatorType;
  requests: Record<number | string, HooTimelineRequest | any> = {};

  constructor(strategy: HooOperatorType = 'switchMap') {
    this.strategy = strategy;
  }

  trigger(id: number | string): void {
    const active = Object.values(this.requests).find(r => r.state === 'active');
    if (this.strategy === 'exhaustMap' && active) {
      this.requests[id] = { id, state: 'ignored' };
      return;
    }
    if (this.strategy === 'switchMap' && active) {
      active.state = 'cancelled';
    }
    if (this.strategy === 'concatMap' && active) {
      this.requests[id] = { id, state: 'queued' };
      return;
    }
    this.requests[id] = { id, state: 'active' };
  }

  complete(id: number | string): void {
    if (this.requests[id]) {
      this.requests[id].state = 'completed';
      if (this.strategy === 'concatMap') {
        const nextQueued = Object.values(this.requests).find(r => r.state === 'queued');
        if (nextQueued) nextQueued.state = 'active';
      }
    }
  }
}
