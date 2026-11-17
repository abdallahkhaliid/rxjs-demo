import { ComparisonData, QuizQuestion } from '../../core/models';

export type SubjectType = 'Subject' | 'BehaviorSubject' | 'ReplaySubject' | 'AsyncSubject';

export type ObserverId = 'A' | 'B' | 'C';

export type ObserverStatus = 'idle' | 'connected' | 'completed' | 'error';

export type EmissionSource = 'live' | 'replay' | 'status';

export interface ObserverLogItem {
  id: string;
  timestamp: number;
  relativeMs: number;
  type: 'next' | 'error' | 'complete' | 'subscribed' | 'unsubscribed';
  value?: any;
  source?: EmissionSource;
  displayValue: string;
}

export interface ObserverViewModel {
  id: ObserverId;
  name: string;
  color: string;
  status: ObserverStatus;
  subscriptionTime: number | null;
  emissions: ObserverLogItem[];
  totalReceived: number;
}

export interface SubjectStatusModel {
  isStopped: boolean;
  hasError: boolean;
  errorMessage?: string;
  isCompleted: boolean;
  isClosed: boolean;
  currentValue?: any;
  emissionCount: number;
  activeSubscriberCount: number;
}

export interface SubjectPillar {
  title: string;
  description: string;
}

export interface SubjectConceptSection {
  title: string;
  content: string;
}

export interface SubjectTopicData {
  id: string;
  subjectType: SubjectType;
  title: string;
  subtitle: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  concept: {
    summary: string;
    pillarsTitle?: string;
    pillars?: SubjectPillar[];
    sections: SubjectConceptSection[];
    takeaways: string[];
  };
  code: {
    title: string;
    code: string;
    language: string;
    highlightLines?: number[];
  };
  comparison: ComparisonData;
  quiz: QuizQuestion[];
  demo: {
    title: string;
    description: string;
  };
}
