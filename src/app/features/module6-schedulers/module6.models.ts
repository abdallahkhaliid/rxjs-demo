import { ComparisonData, ConsoleEntry, QuizQuestion } from '../../core/models';

export type SchedulerId = 'queue' | 'asap' | 'async' | 'animation-frame' | 'sync';

export type EventLoopPhase =
  | 'idle'
  | 'synchronous'
  | 'microtask'
  | 'render'
  | 'macrotask'
  | 'completed';

export type SimulationActionType =
  | 'enqueue'
  | 'dequeue_to_stack'
  | 'executing'
  | 'output_logged'
  | 'pop_stack'
  | 'cancelled';

export interface TaskItem {
  id: string;
  name: string;
  scheduler: SchedulerId;
  delayMs?: number;
  state?: any;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  outputMessage?: string;
  isRecursive?: boolean;
  recursionDepth?: number;
}

export interface EventLoopQueuesState {
  callStack: TaskItem[];
  trampolineQueue: TaskItem[];
  microtaskQueue: TaskItem[];
  macrotaskQueue: TaskItem[];
  renderQueue: TaskItem[];
}

export interface SimulationStep {
  stepNumber: number;
  phase: EventLoopPhase;
  phaseTitle: string;
  action: SimulationActionType;
  activeTaskId: string | null;
  queues: EventLoopQueuesState;
  explanation: string;
  consoleOutput: ConsoleEntry[];
  codeLineHighlight?: number;
}

export interface SimulationScenario {
  id: string;
  name: string;
  badge: string;
  description: string;
  codeSnippet: string;
  steps: SimulationStep[];
}

export interface SchedulerTopicConfig {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  schedulerType: SchedulerId;
  concept: {
    summary: string;
    pillarsTitle?: string;
    pillars?: { title: string; description: string }[];
    sections: { title: string; content: string }[];
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
