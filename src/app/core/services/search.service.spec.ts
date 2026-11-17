import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { SearchService } from './search.service';

describe('SearchService', () => {
  let service: SearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        SearchService
      ]
    });
    service = TestBed.inject(SearchService);
  });

  it('should be created with 8 curriculum module groups', () => {
    expect(service).toBeTruthy();
    expect(service.navGroups().length).toBe(8);
    expect(service.searchableItems().length).toBeGreaterThan(40);
  });

  it('should return empty results for blank query', () => {
    service.setQuery('');
    expect(service.searchResults()).toEqual([]);
  });

  it('should match topics and operators by name query', () => {
    service.setQuery('switchMap');
    const results = service.searchResults();
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.title.toLowerCase().includes('switchmap'))).toBeTrue();
  });

  it('should handle open and close search modal state', () => {
    service.openSearch();
    expect(service.isSearchOpen()).toBeTrue();

    service.closeSearch();
    expect(service.isSearchOpen()).toBeFalse();
    expect(service.searchQuery()).toBe('');
  });
});
