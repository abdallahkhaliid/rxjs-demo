import { Injectable, inject, signal, WritableSignal, DestroyRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subject, filter } from 'rxjs';
import { SearchService } from './search.service';

export const CURRICULUM_ROUTES: string[] = [
  // Module 1 (7)
  '/module1/what-is-rxjs',
  '/module1/what-is-observable',
  '/module1/observable-vs-promise',
  '/module1/observer-subscriber',
  '/module1/subscription-lifecycle',
  '/module1/cold-vs-hot',
  '/module1/multicasting',

  // Module 2 (12)
  '/module2/of',
  '/module2/from',
  '/module2/from-event',
  '/module2/interval',
  '/module2/timer',
  '/module2/range',
  '/module2/throw-error',
  '/module2/defer',
  '/module2/empty',
  '/module2/never',
  '/module2/generate',
  '/module2/iif',

  // Module 3: Transformation (18)
  '/module3/transformation/map',
  '/module3/transformation/mapTo',
  '/module3/transformation/pluck',
  '/module3/transformation/scan',
  '/module3/transformation/reduce',
  '/module3/transformation/toArray',
  '/module3/transformation/buffer',
  '/module3/transformation/bufferCount',
  '/module3/transformation/bufferTime',
  '/module3/transformation/bufferToggle',
  '/module3/transformation/bufferWhen',
  '/module3/transformation/window',
  '/module3/transformation/windowCount',
  '/module3/transformation/windowTime',
  '/module3/transformation/windowToggle',
  '/module3/transformation/windowWhen',
  '/module3/transformation/pairwise',
  '/module3/transformation/groupBy',

  // Module 3: Filtering (19)
  '/module3/filtering/filter',
  '/module3/filtering/take',
  '/module3/filtering/takeLast',
  '/module3/filtering/takeUntil',
  '/module3/filtering/takeWhile',
  '/module3/filtering/skip',
  '/module3/filtering/skipLast',
  '/module3/filtering/skipUntil',
  '/module3/filtering/skipWhile',
  '/module3/filtering/distinct',
  '/module3/filtering/distinctUntilChanged',
  '/module3/filtering/distinctUntilKeyChanged',
  '/module3/filtering/debounce',
  '/module3/filtering/debounceTime',
  '/module3/filtering/throttle',
  '/module3/filtering/throttleTime',
  '/module3/filtering/audit',
  '/module3/filtering/auditTime',
  '/module3/filtering/sample',

  // Module 3: Combination (11)
  '/module3/combination/combineLatest',
  '/module3/combination/concat',
  '/module3/combination/merge',
  '/module3/combination/forkJoin',
  '/module3/combination/zip',
  '/module3/combination/race',
  '/module3/combination/withLatestFrom',
  '/module3/combination/startWith',
  '/module3/combination/endWith',
  '/module3/combination/concatAll',
  '/module3/combination/mergeAll',

  // Module 3: Utility (12)
  '/module3/utility/tap',
  '/module3/utility/delay',
  '/module3/utility/delayWhen',
  '/module3/utility/timeout',
  '/module3/utility/timeInterval',
  '/module3/utility/timestamp',
  '/module3/utility/finalize',
  '/module3/utility/repeat',
  '/module3/utility/repeatWhen',
  '/module3/utility/retry',
  '/module3/utility/retryWhen',
  '/module3/utility/dematerialize',

  // Module 3: Multicasting (5)
  '/module3/multicasting/share',
  '/module3/multicasting/shareReplay',
  '/module3/multicasting/multicast',
  '/module3/multicasting/publish',
  '/module3/multicasting/refCount',

  // Module 4 (5)
  '/module4/overview',
  '/module4/switch-map',
  '/module4/merge-map',
  '/module4/concat-map',
  '/module4/exhaust-map',

  // Module 5 (4)
  '/module5/sandbox',
  '/module5/behavior-subject',
  '/module5/replay-subject',
  '/module5/async-subject',

  // Module 6 (5)
  '/module6/visualizer',
  '/module6/queue',
  '/module6/asap',
  '/module6/async',
  '/module6/animation-frame',

  // Module 7 (4)
  '/module7/http-patterns',
  '/module7/reactive-forms',
  '/module7/lifecycle',
  '/module7/state-store',

  // Module 8 (6)
  '/module8/search-autocomplete',
  '/module8/live-dashboard',
  '/module8/shopping-cart',
  '/module8/http-manager',
  '/module8/polling-system',
  '/module8/multistep-form'
];

@Injectable({
  providedIn: 'root'
})
export class KeyboardNavigationService {
  private readonly router = inject(Router);
  private readonly searchService = inject(SearchService);
  private readonly destroyRef = inject(DestroyRef);

  // Curriculum routes sequence
  readonly curriculumRoutes: WritableSignal<string[]> = signal<string[]>(CURRICULUM_ROUTES);
  readonly currentRouteIndex: WritableSignal<number> = signal<number>(0);
  readonly isHelpOpen: WritableSignal<boolean> = signal<boolean>(false);
  readonly runExecutionTriggered = new Subject<void>();

  private keyListener = (event: KeyboardEvent) => this.handleGlobalKeydown(event);

  constructor() {
    // Listen to router navigation to update currentRouteIndex
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => {
        this.syncRouteIndex(event.urlAfterRedirects || event.url);
      });

    // Initial sync
    if (this.router.url) {
      this.syncRouteIndex(this.router.url);
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.keyListener);
      this.destroyRef.onDestroy(() => {
        window.removeEventListener('keydown', this.keyListener);
      });
    }
  }

  syncRouteIndex(url: string): void {
    const cleanUrl = (url || '').split('?')[0].split('#')[0];
    const routes = this.curriculumRoutes();
    const idx = routes.findIndex(r => r === cleanUrl || cleanUrl.startsWith(r));
    if (idx !== -1) {
      this.currentRouteIndex.set(idx);
    }
  }

  getCurrentRoute(): string {
    const routes = this.curriculumRoutes();
    return routes[this.currentRouteIndex()] || '/';
  }

  isTypingTarget(target: EventTarget | null): boolean {
    const active = typeof document !== 'undefined' ? (document.activeElement as HTMLElement) : null;
    const candidates = [target, active].filter((el): el is HTMLElement => !!el && el instanceof HTMLElement);

    for (const el of candidates) {
      const tagName = el.tagName ? el.tagName.toUpperCase() : '';
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
        return true;
      }

      if (el.isContentEditable || el.getAttribute('contenteditable') === 'true') {
        return true;
      }

      if (
        el.closest &&
        (el.closest('.monaco-editor') ||
          el.closest('.ace_editor') ||
          el.closest('app-code-block') ||
          el.closest('.code-editor') ||
          el.closest('[contenteditable="true"]') ||
          el.closest('[role="textbox"]') ||
          el.closest('.prevent-nav'))
      ) {
        return true;
      }
    }

    return false;
  }

  handleGlobalKeydown(event: KeyboardEvent): void {
    // Strict Focus Guard: ignore keystrokes inside input / textarea / code editor
    if (this.isTypingTarget(event.target)) {
      return;
    }

    const key = event.key;
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;

    // Command palette toggle shortcuts: Ctrl+K, Cmd+K, or '/'
    if ((isCtrlOrCmd && key.toLowerCase() === 'k') || key === '/') {
      event.preventDefault();
      if (this.searchService.isSearchOpen()) {
        this.searchService.closeSearch();
      } else {
        this.searchService.openSearch();
      }
      return;
    }

    // Modal Close Shortcut: Escape
    if (key === 'Escape') {
      if (this.isHelpOpen()) {
        event.preventDefault();
        this.isHelpOpen.set(false);
        return;
      }
      if (this.searchService.isSearchOpen()) {
        event.preventDefault();
        this.searchService.closeSearch();
        return;
      }
    }

    // Shortcuts Cheatsheet: '?'
    if (key === '?' && !isCtrlOrCmd) {
      event.preventDefault();
      this.isHelpOpen.update(v => !v);
      return;
    }

    // Playground Run: Ctrl+Enter or Cmd+Enter
    if (isCtrlOrCmd && key === 'Enter') {
      event.preventDefault();
      this.runExecutionTriggered.next();
      return;
    }

    // Modal guard: do not navigate if search palette or help modal is open
    if (this.searchService.isSearchOpen() || this.isHelpOpen()) {
      return;
    }

    // Ignore Alt combinations (used for playground tab switching)
    if (event.altKey) {
      return;
    }

    // Next Topic: 'j' or 'ArrowRight'
    if (key === 'j' || key === 'ArrowRight') {
      if (!isCtrlOrCmd) {
        event.preventDefault();
        this.nextTopic();
      }
      return;
    }

    // Previous Topic: 'k' or 'ArrowLeft'
    if (key === 'k' || key === 'ArrowLeft') {
      if (!isCtrlOrCmd) {
        event.preventDefault();
        this.prevTopic();
      }
      return;
    }
  }

  nextTopic(): void {
    const routes = this.curriculumRoutes();
    if (this.currentRouteIndex() < routes.length - 1) {
      const nextIdx = this.currentRouteIndex() + 1;
      this.currentRouteIndex.set(nextIdx);
      this.router.navigateByUrl(routes[nextIdx]);
    }
  }

  prevTopic(): void {
    const routes = this.curriculumRoutes();
    if (this.currentRouteIndex() > 0) {
      const prevIdx = this.currentRouteIndex() - 1;
      this.currentRouteIndex.set(prevIdx);
      this.router.navigateByUrl(routes[prevIdx]);
    }
  }

  toggleHelp(): void {
    this.isHelpOpen.update(v => !v);
  }
}
