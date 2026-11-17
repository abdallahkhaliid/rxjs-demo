import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Router } from '@angular/router';
import { KeyboardNavigationService } from './keyboard-navigation.service';
import { SearchService } from './search.service';

describe('KeyboardNavigationService (Milestone 6 Unit Acceptance Suite)', () => {
  let service: KeyboardNavigationService;
  let searchService: SearchService;
  let router: Router;

  const MOCK_ROUTES = [
    '/module1/what-is-rxjs',
    '/module1/what-is-observable',
    '/module2/of',
    '/module3/transformation/map',
    '/module8/multistep-form'
  ];

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        SearchService,
        KeyboardNavigationService,
        {
          provide: Router,
          useValue: {
            navigateByUrl: jasmine.createSpy('navigateByUrl').and.returnValue(Promise.resolve(true)),
            url: '/module1/what-is-rxjs',
            events: {
              pipe: () => ({
                subscribe: () => ({ unsubscribe: () => {} })
              })
            }
          }
        }
      ]
    });

    service = TestBed.inject(KeyboardNavigationService);
    searchService = TestBed.inject(SearchService);
    router = TestBed.inject(Router);

    // Override curriculum routes with test sample
    service.curriculumRoutes.set(MOCK_ROUTES);
    service.currentRouteIndex.set(0);
  });

  afterEach(() => {
    localStorage.clear();
  });

  // =========================================================================
  // 1. Sequential Navigation (j and k Keystrokes)
  // =========================================================================
  describe('Sequential Topic Navigation', () => {
    it('KNS-1.1: should advance to next topic when "j" is pressed', () => {
      const event = new KeyboardEvent('keydown', { key: 'j', bubbles: true });
      service.handleGlobalKeydown(event);

      expect(service.currentRouteIndex()).toBe(1);
      expect(router.navigateByUrl).toHaveBeenCalledWith('/module1/what-is-observable');
    });

    it('KNS-1.2: should advance to next topic when "ArrowRight" is pressed without Alt key', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
      service.handleGlobalKeydown(event);

      expect(service.currentRouteIndex()).toBe(1);
      expect(router.navigateByUrl).toHaveBeenCalledWith('/module1/what-is-observable');
    });

    it('KNS-1.3: should navigate to previous topic when "k" is pressed', () => {
      service.currentRouteIndex.set(2); // '/module2/of'
      const event = new KeyboardEvent('keydown', { key: 'k', bubbles: true });
      service.handleGlobalKeydown(event);

      expect(service.currentRouteIndex()).toBe(1);
      expect(router.navigateByUrl).toHaveBeenCalledWith('/module1/what-is-observable');
    });

    it('KNS-1.4: should navigate to previous topic when "ArrowLeft" is pressed without Alt key', () => {
      service.currentRouteIndex.set(2);
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true });
      service.handleGlobalKeydown(event);

      expect(service.currentRouteIndex()).toBe(1);
      expect(router.navigateByUrl).toHaveBeenCalledWith('/module1/what-is-observable');
    });
  });

  // =========================================================================
  // 2. Boundary Clamping & Underflow / Overflow Protection
  // =========================================================================
  describe('Boundary Clamping', () => {
    it('KNS-2.1: should clamp at index 0 when "k" is pressed on the very first topic (no underflow)', () => {
      service.currentRouteIndex.set(0);
      const event = new KeyboardEvent('keydown', { key: 'k', bubbles: true });
      service.handleGlobalKeydown(event);

      expect(service.currentRouteIndex()).toBe(0);
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });

    it('KNS-2.2: should clamp at last index when "j" is pressed on final topic (no overflow)', () => {
      const lastIndex = MOCK_ROUTES.length - 1;
      service.currentRouteIndex.set(lastIndex);
      const event = new KeyboardEvent('keydown', { key: 'j', bubbles: true });
      service.handleGlobalKeydown(event);

      expect(service.currentRouteIndex()).toBe(lastIndex);
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 3. Crucial Focus Guard (Input Interception Protection)
  // =========================================================================
  describe('Active Input Focus Guard', () => {
    it('KNS-3.1: should ignore "j" and "k" when focused inside an HTMLInputElement', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      const event = new KeyboardEvent('keydown', { key: 'j', bubbles: true });
      service.handleGlobalKeydown(event);

      expect(service.currentRouteIndex()).toBe(0);
      expect(router.navigateByUrl).not.toHaveBeenCalled();
      document.body.removeChild(input);
    });

    it('KNS-3.2: should ignore keystrokes when focused inside an HTMLTextAreaElement', () => {
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      textarea.focus();

      const event = new KeyboardEvent('keydown', { key: 'j', bubbles: true });
      service.handleGlobalKeydown(event);

      expect(service.currentRouteIndex()).toBe(0);
      expect(router.navigateByUrl).not.toHaveBeenCalled();
      document.body.removeChild(textarea);
    });

    it('KNS-3.3: should ignore keystrokes when inside contenteditable element or code block', () => {
      const editorDiv = document.createElement('div');
      editorDiv.setAttribute('contenteditable', 'true');
      editorDiv.tabIndex = 0;
      document.body.appendChild(editorDiv);
      editorDiv.focus();

      const event = new KeyboardEvent('keydown', { key: 'j', bubbles: true });
      service.handleGlobalKeydown(event);

      expect(service.currentRouteIndex()).toBe(0);
      expect(router.navigateByUrl).not.toHaveBeenCalled();
      document.body.removeChild(editorDiv);
    });
  });

  // =========================================================================
  // 4. Modal Guards & Special Shortcuts
  // =========================================================================
  describe('Modal Guards & Special Shortcuts', () => {
    it('KNS-4.1: should suspend topic navigation while search palette is open', () => {
      searchService.openSearch();
      expect(searchService.isSearchOpen()).toBeTrue();

      const event = new KeyboardEvent('keydown', { key: 'j', bubbles: true });
      service.handleGlobalKeydown(event);

      expect(service.currentRouteIndex()).toBe(0);
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });

    it('KNS-4.2: should open search palette on "/" keystroke outside inputs', () => {
      expect(searchService.isSearchOpen()).toBeFalse();
      const event = new KeyboardEvent('keydown', { key: '/', bubbles: true });
      service.handleGlobalKeydown(event);

      expect(searchService.isSearchOpen()).toBeTrue();
    });

    it('KNS-4.3: should toggle keyboard shortcuts cheatsheet modal on "?" keystroke', () => {
      expect(service.isHelpOpen()).toBeFalse();
      const event = new KeyboardEvent('keydown', { key: '?', bubbles: true });
      service.handleGlobalKeydown(event);

      expect(service.isHelpOpen()).toBeTrue();
      service.handleGlobalKeydown(event);
      expect(service.isHelpOpen()).toBeFalse();
    });

    it('KNS-4.4: should close shortcuts cheatsheet on Escape', () => {
      service.isHelpOpen.set(true);
      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      service.handleGlobalKeydown(event);

      expect(service.isHelpOpen()).toBeFalse();
    });

    it('KNS-4.5: should trigger playground execution on Ctrl+Enter', () => {
      let runTriggered = false;
      service.runExecutionTriggered.subscribe(() => { runTriggered = true; });

      const event = new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true });
      service.handleGlobalKeydown(event);

      expect(runTriggered).toBeTrue();
    });
  });
});
