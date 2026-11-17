// Console Model
export type ConsoleEntryType = 'next' | 'error' | 'complete' | 'subscribe' | 'unsubscribe' | 'info';

export interface ConsoleEntry {
  id: string;
  timestamp: number;
  relativeMs: number;
  type: ConsoleEntryType;
  streamName?: string;
  value?: any;
  description?: string;
}

// Marble Diagram Model
export interface MarbleEmission {
  id: string;
  timeMs: number;
  value: any;
  displayLabel: string;
  color?: string;
  shape?: 'circle' | 'square' | 'diamond';
}

export interface MarbleStream {
  id: string;
  label: string;
  color?: string;
  emissions: MarbleEmission[];
  completedAtMs?: number;
  errorAtMs?: number;
}

// Operator Metadata Model
export type OperatorCategory =
  | 'Creation'
  | 'Transformation'
  | 'Filtering'
  | 'Combination'
  | 'Multicasting'
  | 'Utility'
  | 'Error Handling';

export interface OperatorMetadata {
  name: string;
  category: OperatorCategory;
  signature: string;
  summary: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  useCases?: string[];
  pitfalls?: string[];
  marbleRules?: string[];
  relatedOperators?: string[];
  docUrl?: string;
  isDeprecated?: boolean;
  deprecationNotice?: string;
  modernAlternative?: string;
}

// Comparison Table Model
export interface ComparisonFeature {
  id: string;
  label: string;
  description?: string;
}

export interface ComparisonItem {
  id: string;
  name: string;
  badge?: string;
  recommendedUse: string;
  characteristics?: Record<string, { text: string; status?: 'positive' | 'neutral' | 'negative' }>;
}

export interface ComparisonData {
  features: ComparisonFeature[];
  items: ComparisonItem[];
}

// Playground Model
export type PlaygroundTab = 'concept' | 'code' | 'visual' | 'comparison' | 'quiz';

export interface PlaygroundTabItem {
  id: PlaygroundTab;
  label: string;
  icon?: string;
  badge?: string;
}

// Quiz Model
export interface QuizOption {
  id: string;
  text: string;
  codeSnippet?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  codeSnippet?: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
}

export interface QuizScore {
  total: number;
  correct: number;
  percentage: number;
  passed: boolean;
}

// Progress Tracking Data Models
export interface StoredQuizScore {
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  timestamp: number;
}

export interface StoredProgressState {
  version?: number;
  completedTopics: string[] | Record<string, boolean>;
  quizScores: Record<string, StoredQuizScore | number>;
  lastVisitedTopic?: string;
  lastVisitedRoute?: string;
  updatedAt?: number;
}

export interface ModuleProgress {
  moduleId: string;         // e.g. 'module1' or '1'
  moduleNumber: number;     // 1 to 8
  title: string;
  totalTopics: number;
  completedTopics: number;
  completed: number;        // alias for completedTopics
  total: number;            // alias for totalTopics
  percentage: number;       // 0 to 100
  isCompleted: boolean;
  topicIds: string[];
}

export interface ProgressSummary {
  totalTracked: number;
  completedCount: number;
  overallPercentage: number;
  quizScoresCount: number;
  modulesCompleted: number;
  lastVisitedTopic: string | null;
}

// Search Catalog Models
export type SearchItemType =
  | 'concept'
  | 'creation'
  | 'transformation'
  | 'filtering'
  | 'combination'
  | 'utility'
  | 'multicasting'
  | 'higher-order'
  | 'subject'
  | 'scheduler'
  | 'angular'
  | 'project'
  | 'operator';

export interface SearchCatalogItem {
  id: string;
  title: string;
  category: string;
  moduleNumber: number;
  route: string;
  path: string; // alias for route
  description: string;
  tags: string[];
  keywords?: string[]; // alias for tags
  type: SearchItemType;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

// Navigation & Search Models
export interface TopicNavItem {
  id: string;
  title: string;
  path: string;
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface ModuleNavGroup {
  id: string;
  moduleNumber: number;
  title: string;
  description: string;
  icon: string;
  basePath: string;
  topics: TopicNavItem[];
}

export interface SearchResult {
  id: string;
  title: string;
  category: string;
  description: string;
  path: string;
  route?: string;
  type: 'concept' | 'operator' | 'project' | string;
  moduleNumber?: number;
  tags?: string[];
  keywords?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

// Backend API response models
export interface SlowApiResponse {
  status: 'success';
  endpoint: string;
  delay: number;
  tag: string;
  requestTimestamp: number;
  responseTimestamp: number;
  elapsedMs: number;
  data: {
    message: string;
    serverTime: string;
  };
}

export interface SimulateErrorSuccessResponse {
  status: 'success';
  endpoint: string;
  rate: number;
  randomRoll: number;
  attempt: number;
  timestamp: number;
  message: string;
  data: any;
}

export interface SimulateErrorFailureResponse {
  status: 'error';
  endpoint: string;
  statusCode: number;
  rate: number;
  randomRoll: number;
  attempt: number;
  code: string;
  message: string;
  timestamp: number;
  suggestedAction?: string;
}

export interface Lesson {
  id: number;
  description: string;
  duration: string;
  seqNo: number;
  courseId: number;
}

export interface LessonsResponse {
  lessons: Lesson[];
  total: number;
  pageNumber: number;
  pageSize: number;
}

export interface Course {
  id: number;
  description: string;
  iconUrl?: string;
  courseListIcon?: string;
  longDescription: string;
  category: string;
  lessonsCount: number;
}

export type CourseWithLessons = Course & {
  lessons: Lesson[];
};
