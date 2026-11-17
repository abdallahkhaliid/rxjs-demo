import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, Component } from '@angular/core';
import { Router } from '@angular/router';
import { SearchPaletteComponent } from './search-palette.component';
import { SearchService } from '../../services/search.service';
import { SearchCatalogItem } from '../../models';

@Component({
  template: '',
  standalone: true
})
class DummyRouteComponent {}

describe('SearchPaletteComponent (Milestone 6 Unit Acceptance Suite)', () => {
  let fixture: ComponentFixture<SearchPaletteComponent>;
  let component: SearchPaletteComponent;
  let searchService: SearchService;
  let router: Router;

  const MOCK_ITEMS: SearchCatalogItem[] = [
    {
      id: 'switch-map',
      title: 'switchMap',
      category: 'Higher-Order Observables',
      moduleNumber: 4,
      route: '/module4/switch-map',
      path: '/module4/switch-map',
      description: 'Cancels prior inner observable and switches to latest projection stream',
      tags: ['flattening', 'cancellation', 'hoo', 'search'],
      keywords: ['flattening', 'cancellation', 'hoo', 'search'],
      type: 'higher-order',
      difficulty: 'intermediate'
    },
    {
      id: 'merge-map',
      title: 'mergeMap',
      category: 'Higher-Order Observables',
      moduleNumber: 4,
      route: '/module4/merge-map',
      path: '/module4/merge-map',
      description: 'Merges inner observables concurrently up to optional maxConcurrent limit',
      tags: ['flattening', 'concurrent', 'parallel', 'hoo'],
      keywords: ['flattening', 'concurrent', 'parallel', 'hoo'],
      type: 'higher-order',
      difficulty: 'intermediate'
    },
    {
      id: 'debounce-time',
      title: 'debounceTime',
      category: 'Filtering Operators',
      moduleNumber: 3,
      route: '/module3/filtering/debounceTime',
      path: '/module3/filtering/debounceTime',
      description: 'Emits a value after specified due time of input quiescence',
      tags: ['rate-limiting', 'timing', 'filter'],
      keywords: ['rate-limiting', 'timing', 'filter'],
      type: 'filtering',
      difficulty: 'beginner'
    },
    {
      id: 'search-autocomplete',
      title: 'Search Autocomplete',
      category: 'Real-World Mini-Projects',
      moduleNumber: 8,
      route: '/module8/search-autocomplete',
      path: '/module8/search-autocomplete',
      description: 'Typeahead lesson search against Express backend with debounceTime and switchMap',
      tags: ['autocomplete', 'project', 'search', 'express'],
      keywords: ['autocomplete', 'project', 'search', 'express'],
      type: 'project',
      difficulty: 'intermediate'
    }
  ];

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [SearchPaletteComponent],
      providers: [
        provideZonelessChangeDetection(),
        SearchService,
        {
          provide: Router,
          useValue: {
            navigateByUrl: jasmine.createSpy('navigateByUrl').and.returnValue(Promise.resolve(true)),
            url: '/'
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SearchPaletteComponent);
    component = fixture.componentInstance;
    searchService = TestBed.inject(SearchService);
    router = TestBed.inject(Router);

    // Seed mock items into search service
    searchService.searchableItems.set(MOCK_ITEMS);
    fixture.detectChanges();
  });

  afterEach(() => {
    searchService.closeSearch();
    localStorage.clear();
  });

  // =========================================================================
  // 1. Initial State & Visibility
  // =========================================================================
  describe('Modal Visibility & Mounting', () => {
    it('SPC-1.1: should not render dialog backdrop when isSearchOpen is false', () => {
      searchService.isSearchOpen.set(false);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.search-modal-backdrop')).toBeNull();
    });

    it('SPC-1.2: should render dialog backdrop and input when isSearchOpen is true', () => {
      searchService.isSearchOpen.set(true);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.search-modal-backdrop')).not.toBeNull();
      expect(compiled.querySelector('#global-search-input')).not.toBeNull();
    });
  });

  // =========================================================================
  // 2. Keyboard Triggers (Ctrl+K, Escape)
  // =========================================================================
  describe('Keyboard Triggers', () => {
    it('SPC-2.1: should open command palette on Ctrl+K shortcut', () => {
      expect(searchService.isSearchOpen()).toBeFalse();
      const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true });
      window.dispatchEvent(event);
      fixture.detectChanges();
      expect(searchService.isSearchOpen()).toBeTrue();
    });

    it('SPC-2.2: should open command palette on Cmd+K (Meta+K) shortcut on macOS', () => {
      expect(searchService.isSearchOpen()).toBeFalse();
      const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true });
      window.dispatchEvent(event);
      fixture.detectChanges();
      expect(searchService.isSearchOpen()).toBeTrue();
    });

    it('SPC-2.3: should close open palette on Escape keystroke', () => {
      searchService.openSearch();
      fixture.detectChanges();
      expect(searchService.isSearchOpen()).toBeTrue();

      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      window.dispatchEvent(event);
      fixture.detectChanges();
      expect(searchService.isSearchOpen()).toBeFalse();
    });

    it('SPC-2.4: should close palette when clicking the backdrop overlay', () => {
      searchService.openSearch();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const backdrop = compiled.querySelector('.search-modal-backdrop') as HTMLElement;
      expect(backdrop).not.toBeNull();

      backdrop.click();
      fixture.detectChanges();
      expect(searchService.isSearchOpen()).toBeFalse();
    });
  });

  // =========================================================================
  // 3. Search Term Filtering & Multi-field Scoring
  // =========================================================================
  describe('Search Filtering & Scoring', () => {
    beforeEach(() => {
      searchService.openSearch();
      fixture.detectChanges();
    });

    it('SPC-3.1: should rank exact title match first', () => {
      component.onSearchInputChange('switchMap');
      fixture.detectChanges();

      const results = searchService.searchResults();
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title).toBe('switchMap');
    });

    it('SPC-3.2: should match keywords and tags when title does not match directly', () => {
      component.onSearchInputChange('rate-limiting');
      fixture.detectChanges();

      const results = searchService.searchResults();
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('debounce-time');
    });

    it('SPC-3.3: should match category query across multiple matching items', () => {
      component.onSearchInputChange('Higher-Order');
      fixture.detectChanges();

      const results = searchService.searchResults();
      expect(results.length).toBe(2);
      expect(results.some(r => r.id === 'switch-map')).toBeTrue();
      expect(results.some(r => r.id === 'merge-map')).toBeTrue();
    });

    it('SPC-3.4: should display empty state when search term has zero matches', () => {
      component.onSearchInputChange('nonexistent-term-xyz');
      fixture.detectChanges();

      const results = searchService.searchResults();
      expect(results.length).toBe(0);

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.palette-empty-state, .search-empty-state')).not.toBeNull();
      expect(compiled.textContent).toContain('nonexistent-term-xyz');
    });

    it('SPC-3.5: should display quick jump suggestions when query is blank', () => {
      component.onSearchInputChange('');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.palette-default-state, .search-suggestions')).not.toBeNull();
    });
  });

  // =========================================================================
  // 4. Keyboard Navigation in Results (ArrowDown, ArrowUp, Enter)
  // =========================================================================
  describe('Result Navigation & Route Selection', () => {
    beforeEach(() => {
      searchService.openSearch();
      component.onSearchInputChange('map');
      fixture.detectChanges();
    });

    it('SPC-4.1: should default active selection to first result (index 0)', () => {
      expect(component.selectedResultIndex()).toBe(0);
    });

    it('SPC-4.2: should cycle selection down via ArrowDown and wrap around', () => {
      const resultsCount = searchService.searchResults().length;
      expect(resultsCount).toBeGreaterThan(1);

      const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
      component.handleSearchKeyDown(downEvent);
      expect(component.selectedResultIndex()).toBe(1);

      // Cycle through to wrap around
      for (let i = 1; i < resultsCount; i++) {
        component.handleSearchKeyDown(downEvent);
      }
      expect(component.selectedResultIndex()).toBe(0);
    });

    it('SPC-4.3: should cycle selection up via ArrowUp and wrap to end', () => {
      const resultsCount = searchService.searchResults().length;
      const upEvent = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true });

      // From 0, ArrowUp wraps to end
      component.handleSearchKeyDown(upEvent);
      expect(component.selectedResultIndex()).toBe(resultsCount - 1);
    });

    it('SPC-4.4: should navigate to selected topic route on Enter and close palette', () => {
      const selectedItem = searchService.searchResults()[0];
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });

      component.handleSearchKeyDown(enterEvent);
      expect(router.navigateByUrl).toHaveBeenCalledWith(selectedItem.route || selectedItem.path);
      expect(searchService.isSearchOpen()).toBeFalse();
    });

    it('SPC-4.5: should navigate when clicking directly on a result item', () => {
      const selectedItem = searchService.searchResults()[1];
      component.selectSearchResult(selectedItem);

      expect(router.navigateByUrl).toHaveBeenCalledWith(selectedItem.route || selectedItem.path);
      expect(searchService.isSearchOpen()).toBeFalse();
    });
  });
});
