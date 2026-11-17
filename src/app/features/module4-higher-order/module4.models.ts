export type HooLifecycleState = 'active' | 'queued' | 'cancelled' | 'ignored' | 'completed';

export type HooOperatorType = 'switchMap' | 'mergeMap' | 'concatMap' | 'exhaustMap';

export interface HooTimelineRequest {
  id: number;
  label: string;
  state: HooLifecycleState;
  durationMs: number;
  elapsedMs: number;
  progress: number; // 0 to 100%
  startTime: number;
  activeStartTime?: number;
  endTime?: number;
  emittedValue?: any;
  cancelReason?: string;
  color: string;
  isBackendCall?: boolean;
}

export interface HooTimelineOutputEmission {
  id: string;
  requestId: number;
  timeMs: number;
  value: any;
  displayLabel: string;
  color: string;
}

export interface HooTimelineSnapshot {
  operator: HooOperatorType;
  concurrencyLimit: number;
  requests: HooTimelineRequest[];
  activeCount: number;
  queuedCount: number;
  completedCount: number;
  cancelledCount: number;
  ignoredCount: number;
  outputs: HooTimelineOutputEmission[];
  isRunning: boolean;
}

export interface HooOperatorConfig {
  id: HooOperatorType;
  slug: string;
  name: string;
  title: string;
  subtitle: string;
  signature: string;
  summary: string;
  description: string;
  concurrencyDefault: number;
  concurrencyMin: number;
  concurrencyMax: number;
  allowConcurrencyControl: boolean;
  codeSnippet: string;
  errorHandlingSnippet: string;
  angularPatternSnippet: string;
  useCases: string[];
  pitfalls: string[];
  marbleRules: string[];
}
