import { Course, Lesson } from '../../core/models';

// Recipe 1: HTTP Patterns Models
export interface RetryAttemptLog {
  attempt: number;
  timestamp: number;
  delayMs: number;
  statusCode?: number;
  status: 'pending' | 'success' | 'failed';
  errorMessage?: string;
}

export interface CachedRequestTelemetry {
  subscriberId: string;
  subscribedAt: number;
  receivedAt?: number;
  fromCache: boolean;
  data?: any;
}

// Recipe 2: Reactive Forms Models
export type AutoSaveStatus = 'pristine' | 'typing' | 'saving' | 'saved' | 'error';

export interface FormAutoSavePayload {
  title: string;
  category: string;
  subCategory: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  autoSaveEnabled: boolean;
}

export interface FormTelemetry {
  keystrokesCount: number;
  valueChangesCount: number;
  httpRequestsCount: number;
  cancelledRequestsCount: number;
  lastSavedAt?: number;
}

// Recipe 3: Lifecycle Models
export interface SimulatedWidgetInstance {
  id: string;
  type: 'leaky' | 'managed';
  createdAt: number;
  destroyedAt?: number;
  ticks: number;
  isActive: boolean;
}

export interface LifecycleTelemetry {
  spawnedCount: number;
  destroyedCount: number;
  activeComponentCount: number;
  activeSubscriptionCount: number; // Zombie counter
  totalZombieTicks: number;
  hasMemoryLeak: boolean;
}

// Recipe 4: State Store Models
export interface CourseStoreItem {
  id: number;
  title: string;
  category: 'RxJS' | 'Angular' | 'TypeScript' | 'Architecture';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  enrolled: boolean;
  lessonsCount: number;
  rating: number;
}

export interface CourseStoreState {
  courses: CourseStoreItem[];
  filterCategory: string; // 'all' | 'RxJS' | 'Angular' | 'TypeScript' | 'Architecture'
  filterDifficulty: string; // 'all' | 'beginner' | 'intermediate' | 'advanced'
  searchTerm: string;
  selectedCourseId: number | null;
  loading: boolean;
  lastAction: string;
}

export interface StateTransitionLog {
  id: string;
  timestamp: number;
  action: string;
  payload?: any;
  stateSnapshot: CourseStoreState;
}
