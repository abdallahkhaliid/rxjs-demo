import { Injectable, signal, computed, WritableSignal } from '@angular/core';
import { ModuleNavGroup, SearchCatalogItem } from '../models';
import { SEARCH_CATALOG } from '../data/search-catalog.data';

export const MODULE_NAV_DATA: ModuleNavGroup[] = [
  {
    id: 'module1',
    moduleNumber: 1,
    title: 'Fundamentals',
    description: 'Core reactive principles, Observables, Subscriptions, and Multicasting',
    icon: '⚡',
    basePath: '/module1',
    topics: [
      { id: 'what-is-rxjs', title: 'What is RxJS?', path: '/module1/what-is-rxjs', category: 'Concept', difficulty: 'beginner' },
      { id: 'what-is-observable', title: 'What is an Observable?', path: '/module1/what-is-observable', category: 'Concept', difficulty: 'beginner' },
      { id: 'observable-vs-promise', title: 'Observable vs Promise', path: '/module1/observable-vs-promise', category: 'Comparison', difficulty: 'beginner' },
      { id: 'observer-subscriber', title: 'Observer & Subscriber', path: '/module1/observer-subscriber', category: 'Architecture', difficulty: 'beginner' },
      { id: 'subscription-lifecycle', title: 'Subscription Lifecycle', path: '/module1/subscription-lifecycle', category: 'Lifecycle', difficulty: 'intermediate' },
      { id: 'cold-vs-hot', title: 'Cold vs Hot Observables', path: '/module1/cold-vs-hot', category: 'Architecture', difficulty: 'intermediate' },
      { id: 'multicasting', title: 'Multicasting Fundamentals', path: '/module1/multicasting', category: 'Architecture', difficulty: 'advanced' },
    ]
  },
  {
    id: 'module2',
    moduleNumber: 2,
    title: 'Creation Operators',
    description: '12 essential stream instantiation functions',
    icon: '✨',
    basePath: '/module2',
    topics: [
      { id: 'of', title: 'of()', path: '/module2/of', category: 'Creation', difficulty: 'beginner' },
      { id: 'from', title: 'from()', path: '/module2/from', category: 'Creation', difficulty: 'beginner' },
      { id: 'fromEvent', title: 'fromEvent()', path: '/module2/from-event', category: 'Creation', difficulty: 'beginner' },
      { id: 'interval', title: 'interval()', path: '/module2/interval', category: 'Creation', difficulty: 'beginner' },
      { id: 'timer', title: 'timer()', path: '/module2/timer', category: 'Creation', difficulty: 'beginner' },
      { id: 'range', title: 'range()', path: '/module2/range', category: 'Creation', difficulty: 'beginner' },
      { id: 'throwError', title: 'throwError()', path: '/module2/throw-error', category: 'Creation', difficulty: 'intermediate' },
      { id: 'defer', title: 'defer()', path: '/module2/defer', category: 'Creation', difficulty: 'intermediate' },
      { id: 'empty', title: 'EMPTY', path: '/module2/empty', category: 'Creation', difficulty: 'beginner' },
      { id: 'never', title: 'NEVER', path: '/module2/never', category: 'Creation', difficulty: 'beginner' },
      { id: 'generate', title: 'generate()', path: '/module2/generate', category: 'Creation', difficulty: 'intermediate' },
      { id: 'iif', title: 'iif()', path: '/module2/iif', category: 'Creation', difficulty: 'intermediate' },
    ]
  },
  {
    id: 'module3',
    moduleNumber: 3,
    title: 'Operator Catalog',
    description: '65 Operators across Transformation, Filtering, Combination, Utility, and Multicasting',
    icon: '🧭',
    basePath: '/module3',
    topics: [
      { id: 'transformation', title: 'Transformation (18)', path: '/module3/transformation', category: 'Catalog', difficulty: 'intermediate' },
      { id: 'filtering', title: 'Filtering (19)', path: '/module3/filtering', category: 'Catalog', difficulty: 'intermediate' },
      { id: 'combination', title: 'Combination (11)', path: '/module3/combination', category: 'Catalog', difficulty: 'intermediate' },
      { id: 'utility', title: 'Utility (12)', path: '/module3/utility', category: 'Catalog', difficulty: 'intermediate' },
      { id: 'multicasting-ops', title: 'Multicasting (5)', path: '/module3/multicasting', category: 'Catalog', difficulty: 'advanced' },
    ]
  },
  {
    id: 'module4',
    moduleNumber: 4,
    title: 'Higher-Order Observables',
    description: 'Flattening strategies: switchMap, mergeMap, concatMap, exhaustMap',
    icon: '🔀',
    basePath: '/module4',
    topics: [
      { id: 'hoo-overview', title: 'HOO Overview & Lifecycle', path: '/module4/overview', category: 'HOO', difficulty: 'intermediate' },
      { id: 'switchMap', title: 'switchMap', path: '/module4/switch-map', category: 'HOO', difficulty: 'intermediate' },
      { id: 'mergeMap', title: 'mergeMap', path: '/module4/merge-map', category: 'HOO', difficulty: 'intermediate' },
      { id: 'concatMap', title: 'concatMap', path: '/module4/concat-map', category: 'HOO', difficulty: 'intermediate' },
      { id: 'exhaustMap', title: 'exhaustMap', path: '/module4/exhaust-map', category: 'HOO', difficulty: 'intermediate' },
    ]
  },
  {
    id: 'module5',
    moduleNumber: 5,
    title: 'Subjects Sandbox',
    description: 'Dynamic multicasting with Subject, BehaviorSubject, ReplaySubject, and AsyncSubject',
    icon: '📡',
    basePath: '/module5',
    topics: [
      { id: 'subject-sandbox', title: 'Interactive Subject Sandbox', path: '/module5/sandbox', category: 'Subjects', difficulty: 'intermediate' },
      { id: 'behavior-subject', title: 'BehaviorSubject Deep Dive', path: '/module5/behavior-subject', category: 'Subjects', difficulty: 'beginner' },
      { id: 'replay-subject', title: 'ReplaySubject Deep Dive', path: '/module5/replay-subject', category: 'Subjects', difficulty: 'intermediate' },
      { id: 'async-subject', title: 'AsyncSubject Deep Dive', path: '/module5/async-subject', category: 'Subjects', difficulty: 'intermediate' },
    ]
  },
  {
    id: 'module6',
    moduleNumber: 6,
    title: 'Schedulers Visualizer',
    description: 'Event loop execution order across queue, asap, async, and animationFrame',
    icon: '⏱️',
    basePath: '/module6',
    topics: [
      { id: 'schedulers-visualizer', title: 'Execution Order Visualizer', path: '/module6/visualizer', category: 'Schedulers', difficulty: 'advanced' },
      { id: 'queue-scheduler', title: 'queueScheduler', path: '/module6/queue', category: 'Schedulers', difficulty: 'intermediate' },
      { id: 'asap-scheduler', title: 'asapScheduler', path: '/module6/asap', category: 'Schedulers', difficulty: 'advanced' },
      { id: 'async-scheduler', title: 'asyncScheduler', path: '/module6/async', category: 'Schedulers', difficulty: 'intermediate' },
      { id: 'animation-frame-scheduler', title: 'animationFrameScheduler', path: '/module6/animation-frame', category: 'Schedulers', difficulty: 'advanced' },
    ]
  },
  {
    id: 'module7',
    moduleNumber: 7,
    title: 'RxJS in Angular',
    description: 'HTTP patterns, Reactive Forms, Lifecycle teardown, and BehaviorSubject store',
    icon: '🅰️',
    basePath: '/module7',
    topics: [
      { id: 'http-patterns', title: 'HTTP Patterns & Caching', path: '/module7/http-patterns', category: 'Angular', difficulty: 'intermediate' },
      { id: 'reactive-forms', title: 'Reactive Forms with Debounce', path: '/module7/reactive-forms', category: 'Angular', difficulty: 'intermediate' },
      { id: 'lifecycle-teardown', title: 'Lifecycle & takeUntilDestroyed', path: '/module7/lifecycle', category: 'Angular', difficulty: 'intermediate' },
      { id: 'state-management', title: 'BehaviorSubject State Store', path: '/module7/state-store', category: 'Angular', difficulty: 'advanced' },
    ]
  },
  {
    id: 'module8',
    moduleNumber: 8,
    title: 'Real-World Mini-Projects',
    description: '6 fully functional reactive real-world mini-applications',
    icon: '🚀',
    basePath: '/module8',
    topics: [
      { id: 'search-autocomplete', title: '1. Search Autocomplete', path: '/module8/search-autocomplete', category: 'Project', difficulty: 'intermediate' },
      { id: 'live-dashboard', title: '2. Live Telemetry Dashboard', path: '/module8/live-dashboard', category: 'Project', difficulty: 'intermediate' },
      { id: 'shopping-cart', title: '3. Reactive Shopping Cart', path: '/module8/shopping-cart', category: 'Project', difficulty: 'intermediate' },
      { id: 'http-request-manager', title: '4. HTTP Request Manager', path: '/module8/http-manager', category: 'Project', difficulty: 'advanced' },
      { id: 'polling-system', title: '5. Polling & Tab Suspension', path: '/module8/polling-system', category: 'Project', difficulty: 'advanced' },
      { id: 'multistep-form', title: '6. Multi-Step Form Wizard', path: '/module8/multistep-form', category: 'Project', difficulty: 'advanced' },
    ]
  }
];

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  readonly navGroups = signal<ModuleNavGroup[]>(MODULE_NAV_DATA);
  readonly searchQuery = signal<string>('');
  readonly isSearchOpen = signal<boolean>(false);

  // Search catalog containing all 113 topics, operators, and mini-projects
  readonly searchableItems: WritableSignal<SearchCatalogItem[]> = signal<SearchCatalogItem[]>(SEARCH_CATALOG);

  readonly searchResults = computed<SearchCatalogItem[]>(() => {
    const rawQuery = this.searchQuery();
    if (!rawQuery) return [];

    const query = rawQuery.trim().toLowerCase();
    if (!query) return [];

    return this.searchableItems()
      .map(item => {
        let score = 0;
        const title = (item.title || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        const category = (item.category || '').toLowerCase();
        const tags = (item.tags || item.keywords || []).map(t => (t || '').toLowerCase());

        // Exact match
        if (title === query) score += 100;
        else if (title.startsWith(query)) score += 50;
        else if (title.includes(query)) score += 30;

        // Description match
        if (desc.includes(query)) score += 10;

        // Category match
        if (category.includes(query)) score += 15;

        // Tags / keywords match
        if (tags.some(t => t.includes(query) || query.includes(t))) score += 20;

        return { item, score };
      })
      .filter(entry => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(entry => entry.item);
  });

  openSearch(): void {
    this.isSearchOpen.set(true);
  }

  closeSearch(): void {
    this.isSearchOpen.set(false);
    this.searchQuery.set('');
  }

  setQuery(q: string): void {
    this.searchQuery.set(q || '');
  }
}
