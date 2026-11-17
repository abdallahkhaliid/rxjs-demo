import { Lesson, QuizQuestion, ComparisonData } from '../../core/models';

// 1. Search Autocomplete Models
export interface SearchAutocompleteState {
  query: string;
  results: Lesson[];
  totalResults: number;
  isLoading: boolean;
  errorMessage: string | null;
  activeRequests: number;
  cancelledRequests: number;
  completedRequests: number;
}

// 2. Live Dashboard Models
export type AlertStatus = 'NORMAL' | 'CRITICAL_CPU' | 'CRITICAL_MEM';

export interface TelemetryPoint {
  cpu: number;          // 0 - 100%
  mem: number;          // 0 - 100%
  net: number;          // MB/s
  timestamp: string;    // ISO string
  alertStatus: AlertStatus;
}

export interface MetricCardConfig {
  id: 'cpu' | 'mem' | 'net';
  title: string;
  unit: string;
  icon: string;
  warningThreshold: number;
  criticalThreshold: number;
}

// 3. Shopping Cart Models
export interface CatalogProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  rating: number;
  badge?: string;
  icon: string;
  description: string;
}

export interface CartItem extends CatalogProduct {
  qty: number;
}

export type CartAction =
  | { type: 'ADD'; item: CatalogProduct; qty?: number }
  | { type: 'REMOVE'; id: number }
  | { type: 'UPDATE_QTY'; id: number; qty: number }
  | { type: 'CLEAR' };

export interface CartSummary {
  subtotal: number;
  discountRate: number;
  discount: number;
  tax: number;
  total: number;
  appliedCoupon: string | null;
  itemCount: number;
}

// 4. HTTP Request Manager Models
export type FlatteningStrategy = 'switchMap' | 'mergeMap' | 'concatMap' | 'exhaustMap';
export type RequestLifecycleStatus = 'idle' | 'queued' | 'active' | 'completed' | 'cancelled' | 'ignored' | 'error';

export interface BenchmarkRequestItem {
  id: number;
  tag: string;
  status: RequestLifecycleStatus;
  startTime?: number;
  endTime?: number;
  durationMs?: number;
  error?: string;
  responseSnippet?: string;
}

export interface StrategyBenchmarkResult {
  strategy: FlatteningStrategy;
  requests: BenchmarkRequestItem[];
  completedCount: number;
  cancelledCount: number;
  ignoredCount: number;
  queuedCount: number;
  totalElapsedMs: number;
  isRunning: boolean;
}

// 5. Polling System Models
export interface PollResultItem {
  pollId: number;
  timestamp: string;
  durationMs: number;
  status: 'ok' | 'offline' | 'retrying';
  attempt: number;
  itemsCount: number;
  snippet?: string;
  error?: string;
}

export interface PollingEngineState {
  isRunning: boolean;
  isTabVisible: boolean;
  intervalMs: number;
  pollCount: number;
  retryCount: number;
  lastLatencyMs: number;
  lastSuccessTimestamp: string | null;
  history: PollResultItem[];
}

// 6. Multi-Step Form Wizard Models
export type UserRole = 'beginner' | 'intermediate' | 'advanced';

export interface WizardStep1Data {
  username: string;
  email: string;
  fullName: string;
}

export interface WizardStep2Data {
  role: UserRole;
  topics: string[];
  experienceYears: number;
  newsletter: boolean;
}

export interface WizardStep3Data {
  agreedToTerms: boolean;
  notes: string;
}

export interface WizardFormData {
  currentStep: number;
  step1: WizardStep1Data;
  step2: WizardStep2Data;
  step3: WizardStep3Data;
  completedSteps: Record<number, boolean>;
}

// Mini-Project Topic Definition
export interface MiniProjectTopicConfig {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  conceptSummary: string;
  conceptPillars?: { title: string; description: string }[];
  conceptSections?: { title: string; content: string }[];
  takeaways?: string[];
  codeTitle: string;
  codeSnippet: string;
  comparisonData: ComparisonData;
  quizQuestions: QuizQuestion[];
}
