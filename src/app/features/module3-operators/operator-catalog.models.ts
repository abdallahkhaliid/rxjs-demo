import { Observable } from 'rxjs';
import {
  OperatorMetadata,
  ComparisonData,
  QuizQuestion,
  MarbleStream,
  OperatorCategory
} from '../../core/models';

export type OperatorCategoryId =
  | 'transformation'
  | 'filtering'
  | 'combination'
  | 'utility'
  | 'multicasting';

export type ParamControl = 'slider' | 'number' | 'select' | 'boolean' | 'text';

export interface ParamOption {
  label: string;
  value: any;
}

export interface OperatorParamConfig {
  id: string;
  name: string;
  type: ParamControl;
  defaultValue: any;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: ParamOption[];
  description?: string;
}

export type TunableParam = OperatorParamConfig;

export type SourceStreamPreset =
  | 'interval'
  | 'burst'
  | 'words'
  | 'duplicates'
  | 'error'
  | 'objects'
  | 'custom'
  | 'numbers_interval'
  | 'sync_numbers'
  | 'sync_strings';

export interface InteractiveConfig {
  sourcePreset: SourceStreamPreset;
  params: OperatorParamConfig[];
  description: string;
  sourceStreamLabel?: string;
  secondaryStreamLabel?: string;
}

export interface AsciiMarble {
  input: string;
  secondaryInput?: string;
  operator: string;
  output: string;
}

export interface PipelineContext {
  source2$?: Observable<any>;
  notifier$?: Observable<any>;
}

export interface OperatorDefinition {
  id: string;
  name: string;
  category: OperatorCategoryId;
  categoryDisplayName?: string;
  signature: string;
  summary: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  metadata: OperatorMetadata;
  codeSnippet: string;
  codeExample: string;
  asciiMarble: AsciiMarble;
  marbleString?: string;
  defaultSourcePreset: SourceStreamPreset;
  defaultSource2Preset?: SourceStreamPreset;
  parameters: OperatorParamConfig[];
  interactiveConfig: InteractiveConfig;
  initialMarbles: {
    inputStreams: MarbleStream[];
    outputStream: MarbleStream;
  };
  comparison: ComparisonData;
  quiz: QuizQuestion[];
  hasNotifierTrigger?: boolean;
  notifierLabel?: string;
  useCases?: string[];
  pitfalls?: string[];
  relatedOperators?: string[];
  docUrl?: string;
  isDeprecated?: boolean;
  deprecationNotice?: string;
  modernAlternative?: string;
  pipelineFactory: (source$: Observable<any>, params: Record<string, any>, context: PipelineContext) => Observable<any>;
}

export interface CategoryInfo {
  id: OperatorCategoryId;
  title: string;
  badgeLabel: string;
  badgeClass: string;
  icon: string;
  description: string;
  operatorIds: string[];
}
