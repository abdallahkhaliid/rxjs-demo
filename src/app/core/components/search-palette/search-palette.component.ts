import {
  Component,
  inject,
  signal,
  computed,
  HostListener,
  ElementRef,
  viewChild,
  effect
} from '@angular/core';
import { Router } from '@angular/router';
import { SearchService } from '../../services/search.service';
import { SearchCatalogItem, SearchResult } from '../../models';

@Component({
  selector: 'app-search-palette',
  standalone: true,
  templateUrl: './search-palette.component.html',
  styleUrl: './search-palette.component.scss'
})
export class SearchPaletteComponent {
  readonly searchService = inject(SearchService);
  private readonly router = inject(Router);

  readonly searchInputRef = viewChild<ElementRef<HTMLInputElement>>('searchInputEl');
  readonly searchInput = signal<string>('');
  readonly selectedResultIndex = signal<number>(0);
  readonly selectedCategoryFilter = signal<string>('all');

  // Filtered results based on search query and category filter
  readonly filteredResults = computed<SearchCatalogItem[]>(() => {
    const raw = this.searchService.searchResults();
    const filter = this.selectedCategoryFilter();
    if (filter === 'all') return raw;

    return raw.filter(item => {
      const type = (item.type || '').toLowerCase();
      const cat = (item.category || '').toLowerCase();
      const filterLower = filter.toLowerCase();

      if (filterLower === 'operator') {
        return (
          type === 'creation' ||
          type === 'transformation' ||
          type === 'filtering' ||
          type === 'combination' ||
          type === 'utility' ||
          type === 'multicasting' ||
          type === 'higher-order' ||
          type === 'operator' ||
          cat.includes('operator')
        );
      }
      return type === filterLower || cat.includes(filterLower);
    });
  });

  constructor() {
    // Auto-focus search input when palette opens
    effect(() => {
      if (this.searchService.isSearchOpen()) {
        this.selectedResultIndex.set(0);
        this.searchInput.set(this.searchService.searchQuery());
        setTimeout(() => {
          const input = document.getElementById('global-search-input') as HTMLInputElement;
          if (input) {
            input.focus();
            input.select();
          }
        }, 50);
      }
    });
  }

  @HostListener('window:keydown', ['$event'])
  handleGlobalShortcut(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (this.searchService.isSearchOpen()) {
        this.closeSearch();
      } else {
        this.openSearch();
      }
    } else if (event.key === 'Escape' && this.searchService.isSearchOpen()) {
      event.preventDefault();
      this.closeSearch();
    }
  }

  openSearch(): void {
    this.searchService.openSearch();
    this.searchInput.set('');
    this.selectedResultIndex.set(0);
    setTimeout(() => {
      const input = document.getElementById('global-search-input') as HTMLInputElement;
      if (input) input.focus();
    }, 50);
  }

  closeSearch(): void {
    this.searchService.closeSearch();
    this.searchInput.set('');
    this.selectedResultIndex.set(0);
  }

  onSearchInputChange(value: string): void {
    this.searchInput.set(value);
    this.searchService.setQuery(value);
    this.selectedResultIndex.set(0);
  }

  clearQuery(): void {
    this.searchInput.set('');
    this.searchService.setQuery('');
    this.selectedResultIndex.set(0);
    const input = document.getElementById('global-search-input') as HTMLInputElement;
    if (input) input.focus();
  }

  setCategoryFilter(category: string): void {
    this.selectedCategoryFilter.set(category);
    this.selectedResultIndex.set(0);
  }

  handleSearchKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeSearch();
      return;
    }

    const items = this.filteredResults();
    if (items.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.selectedResultIndex.update(idx => (idx + 1) % items.length);
      this.scrollToActiveItem();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectedResultIndex.update(idx => (idx - 1 + items.length) % items.length);
      this.scrollToActiveItem();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const current = items[this.selectedResultIndex()];
      if (current) {
        this.selectSearchResult(current);
      }
    }
  }

  selectSearchResult(result: SearchCatalogItem | SearchResult): void {
    this.closeSearch();
    const route = result.route || result.path;
    if (route) {
      this.router.navigateByUrl(route);
    }
  }

  private scrollToActiveItem(): void {
    setTimeout(() => {
      const activeEl = document.querySelector('.search-result-item.selected, .palette-item.selected');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 10);
  }
}
