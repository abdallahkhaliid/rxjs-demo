import {
  CategoryInfo,
  OperatorCategoryId,
  OperatorDefinition
} from './operator-catalog.models';
import { TRANSFORMATION_OPERATORS } from './data/transformation.data';
import { FILTERING_OPERATORS } from './data/filtering.data';
import { COMBINATION_OPERATORS } from './data/combination.data';
import { UTILITY_OPERATORS } from './data/utility.data';
import { MULTICASTING_OPERATORS } from './data/multicasting.data';

export * from './operator-catalog.models';
export * from './data/transformation.data';
export * from './data/filtering.data';
export * from './data/combination.data';
export * from './data/utility.data';
export * from './data/multicasting.data';

export const MODULE3_OPERATORS: Record<string, OperatorDefinition> = {
  ...TRANSFORMATION_OPERATORS,
  ...FILTERING_OPERATORS,
  ...COMBINATION_OPERATORS,
  ...UTILITY_OPERATORS,
  ...MULTICASTING_OPERATORS
};

export const OPERATOR_CATALOG = MODULE3_OPERATORS;

export const CATEGORY_DEFAULT_OPERATOR: Record<OperatorCategoryId, string> = {
  transformation: 'map',
  filtering: 'filter',
  combination: 'combineLatest',
  utility: 'tap',
  multicasting: 'share'
};

export const OPERATOR_CATEGORIES: CategoryInfo[] = [
  {
    id: 'transformation',
    title: 'Transformation',
    badgeLabel: '18 Operators',
    badgeClass: 'badge-cyan',
    icon: '🔄',
    description: 'Transform, map, buffer, window, and accumulate values across stream lifecycles.',
    operatorIds: Object.keys(TRANSFORMATION_OPERATORS)
  },
  {
    id: 'filtering',
    title: 'Filtering',
    badgeLabel: '19 Operators',
    badgeClass: 'badge-warning',
    icon: '🔍',
    description: 'Filter, rate-limit, debounce, sample, and deduplicate stream values.',
    operatorIds: Object.keys(FILTERING_OPERATORS)
  },
  {
    id: 'combination',
    title: 'Combination',
    badgeLabel: '11 Operators',
    badgeClass: 'badge-primary',
    icon: '🔀',
    description: 'Combine, merge, concatenate, zip, and race multiple observable streams.',
    operatorIds: Object.keys(COMBINATION_OPERATORS)
  },
  {
    id: 'utility',
    title: 'Utility',
    badgeLabel: '12 Operators',
    badgeClass: 'badge-magenta',
    icon: '🛠️',
    description: 'Inspect with tap, delay, timeout, retry, repeat, and manage stream lifecycles.',
    operatorIds: Object.keys(UTILITY_OPERATORS)
  },
  {
    id: 'multicasting',
    title: 'Multicasting',
    badgeLabel: '5 Operators',
    badgeClass: 'badge-purple',
    icon: '📡',
    description: 'Share executions, replay caches, and multicast to concurrent subscribers.',
    operatorIds: Object.keys(MULTICASTING_OPERATORS)
  }
];

export const CATEGORY_OPERATOR_MAP: Record<OperatorCategoryId, OperatorDefinition[]> = {
  transformation: Object.values(TRANSFORMATION_OPERATORS),
  filtering: Object.values(FILTERING_OPERATORS),
  combination: Object.values(COMBINATION_OPERATORS),
  utility: Object.values(UTILITY_OPERATORS),
  multicasting: Object.values(MULTICASTING_OPERATORS)
};
