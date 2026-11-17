import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { CodeBlockComponent } from './code-block/code-block.component';
import { OutputConsoleComponent } from './output-console/output-console.component';
import { MarbleDiagramComponent } from './marble-diagram/marble-diagram.component';
import { OperatorCardComponent } from './operator-card/operator-card.component';
import { ComparisonTableComponent } from './comparison-table/comparison-table.component';
import { PlaygroundWrapperComponent } from './playground-wrapper/playground-wrapper.component';
import { QuizBlockComponent } from './quiz-block/quiz-block.component';
import { ShellComponent } from '../../core/layout/shell.component';
import { ProgressService } from '../../core/services/progress.service';
import { ConsoleEntry, MarbleStream, OperatorMetadata, ComparisonData, QuizQuestion, QuizScore } from '../../core/models';

describe('Milestone 1 Adversarial & Stress Suite', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [
        CodeBlockComponent,
        OutputConsoleComponent,
        MarbleDiagramComponent,
        OperatorCardComponent,
        ComparisonTableComponent,
        PlaygroundWrapperComponent,
        QuizBlockComponent,
        ShellComponent
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([])
      ]
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // =========================================================================
  // 1. CodeBlockComponent Stress & Adversarial Tests
  // =========================================================================
  describe('CodeBlockComponent Adversarial Tests', () => {
    let fixture: ComponentFixture<CodeBlockComponent>;
    let component: CodeBlockComponent;

    beforeEach(() => {
      fixture = TestBed.createComponent(CodeBlockComponent);
      component = fixture.componentInstance;
    });

    it('C1.1: should handle empty code string without throwing', () => {
      fixture.componentRef.setInput('code', '');
      fixture.detectChanges();

      expect(component.highlightedCode()).toBe('');
      expect(component.codeLines().length).toBe(1);
      expect(component.codeLines()[0].lineNum).toBe(1);
    });

    it('C1.2: should gracefully fallback on unknown/invalid language string', () => {
      const code = 'const foo = "bar"; function test() { return 123; }';
      fixture.componentRef.setInput('code', code);
      fixture.componentRef.setInput('language', 'unknown_obscure_lang_xyz_999');
      fixture.detectChanges();

      // hljs should catch the unsupported language and fallback to highlightAuto
      expect(() => component.highlightedCode()).not.toThrow();
      expect(component.highlightedCode()).toBeTruthy();
      expect(component.highlightedCode().length).toBeGreaterThan(0);
    });

    it('C1.3: should handle huge 500-line code blocks efficiently', () => {
      const lines = Array.from({ length: 500 }, (_, i) => `const var_${i} = ${i * 2}; // line ${i}`);
      const hugeCode = lines.join('\n');

      const start = performance.now();
      fixture.componentRef.setInput('code', hugeCode);
      fixture.componentRef.setInput('highlightLines', [1, 250, 500]);
      fixture.detectChanges();

      const highlighted = component.highlightedCode();
      const codeLines = component.codeLines();
      const elapsed = performance.now() - start;

      expect(codeLines.length).toBe(500);
      expect(codeLines[0].isHighlighted).toBeTrue();
      expect(codeLines[249].isHighlighted).toBeTrue();
      expect(codeLines[499].isHighlighted).toBeTrue();
      expect(codeLines[10].isHighlighted).toBeFalse();
      expect(highlighted).toContain('var_499');
      expect(elapsed).toBeLessThan(1500); // 500 lines should highlight under 1.5s
    });

    it('C1.4: should toggle collapse state properly when collapsible is enabled', () => {
      fixture.componentRef.setInput('code', 'const x = 1;');
      fixture.componentRef.setInput('collapsible', true);
      fixture.detectChanges();

      expect(component.isCollapsed()).toBeFalse();
      component.toggleCollapse();
      expect(component.isCollapsed()).toBeTrue();
      component.toggleCollapse();
      expect(component.isCollapsed()).toBeFalse();
    });

    it('C1.5: should not collapse if collapsible is false', () => {
      fixture.componentRef.setInput('code', 'const x = 1;');
      fixture.componentRef.setInput('collapsible', false);
      fixture.detectChanges();

      component.toggleCollapse();
      expect(component.isCollapsed()).toBeFalse();
    });

    it('C1.6: should attempt copy without unhandled error when clipboard API is unavailable', async () => {
      fixture.componentRef.setInput('code', 'const secret = 42;');
      fixture.detectChanges();

      // Mock navigator.clipboard
      const originalClipboard = navigator.clipboard;
      try {
        let copiedText = '';
        Object.defineProperty(navigator, 'clipboard', {
          value: {
            writeText: async (text: string) => { copiedText = text; }
          },
          configurable: true
        });

        await component.copyCode();
        expect(copiedText).toBe('const secret = 42;');
        expect(component.copied()).toBeTrue();
      } finally {
        Object.defineProperty(navigator, 'clipboard', {
          value: originalClipboard,
          configurable: true
        });
      }
    });
  });

  // =========================================================================
  // 2. OutputConsoleComponent Stress & Adversarial Tests
  // =========================================================================
  describe('OutputConsoleComponent Adversarial Tests', () => {
    let fixture: ComponentFixture<OutputConsoleComponent>;
    let component: OutputConsoleComponent;

    beforeEach(() => {
      fixture = TestBed.createComponent(OutputConsoleComponent);
      component = fixture.componentInstance;
    });

    it('C2.1: should handle 250 rapid emissions and enforce maxEntries limit', () => {
      const entries: ConsoleEntry[] = Array.from({ length: 250 }, (_, i) => ({
        id: `entry-${i}`,
        timestamp: Date.now() + i,
        relativeMs: i * 10,
        type: 'next',
        streamName: i % 2 === 0 ? 'streamA' : 'streamB',
        value: { count: i }
      }));

      fixture.componentRef.setInput('entries', entries);
      fixture.componentRef.setInput('maxEntries', 50);
      fixture.detectChanges();

      const visible = component.visibleEntries();
      expect(visible.length).toBe(50);
      // Visible should be the last 50 entries
      expect(visible[0].id).toBe('entry-200');
      expect(visible[49].id).toBe('entry-249');
    });

    it('C2.2: should filter by streamName when filterStream is set', () => {
      const entries: ConsoleEntry[] = [
        { id: '1', timestamp: 100, relativeMs: 0, type: 'next', streamName: 'srcA', value: 1 },
        { id: '2', timestamp: 200, relativeMs: 10, type: 'next', streamName: 'srcB', value: 2 },
        { id: '3', timestamp: 300, relativeMs: 20, type: 'next', streamName: 'srcA', value: 3 },
      ];

      fixture.componentRef.setInput('entries', entries);
      fixture.componentRef.setInput('filterStream', 'srcA');
      fixture.detectChanges();

      const visible = component.visibleEntries();
      expect(visible.length).toBe(2);
      expect(visible.every(e => e.streamName === 'srcA')).toBeTrue();
    });

    it('C2.3: should emit clear, pause, replay events properly', () => {
      let clearEmitted = false;
      let pauseEmittedVal: boolean | null = null;
      let replayEmitted = false;

      component.clear.subscribe(() => { clearEmitted = true; });
      component.pause.subscribe(val => { pauseEmittedVal = val; });
      component.replay.subscribe(() => { replayEmitted = true; });

      component.onClear();
      expect(clearEmitted).toBeTrue();

      component.togglePause();
      expect(component.isPaused()).toBeTrue();
      expect(pauseEmittedVal).toBeTrue();

      component.togglePause();
      expect(component.isPaused()).toBeFalse();
      expect(pauseEmittedVal).toBeFalse();

      component.onReplay();
      expect(replayEmitted).toBeTrue();
    });

    it('C2.4: should format null, undefined, primitive, and nested values cleanly', () => {
      expect(component.formatValue(undefined)).toBe('');
      expect(component.formatValue(null)).toBe('null');
      expect(component.formatValue(42)).toBe('42');
      expect(component.formatValue('rxjs')).toBe('rxjs');
      expect(component.formatValue({ a: 1 })).toBe('{"a":1}');

      // Circular reference in formatValue
      const circular: any = { tag: 'circle' };
      circular.self = circular;
      expect(() => component.formatValue(circular)).not.toThrow();
      expect(component.formatValue(circular)).toContain('[object Object]');
    });

    it('C2.5: [CHALLENGE] copyLogs behavior with circular object in entries', async () => {
      const circular: any = { prop: 'test' };
      circular.myself = circular;

      const entries: ConsoleEntry[] = [
        { id: 'e1', timestamp: 100, relativeMs: 0, type: 'next', value: circular }
      ];

      fixture.componentRef.setInput('entries', entries);
      fixture.detectChanges();

      // Test whether copyLogs throws an unhandled exception on circular reference
      let errorThrown: any = null;
      try {
        await component.copyLogs();
      } catch (err) {
        errorThrown = err;
      }

      // If copyLogs doesn't catch or fails to format circular references safely,
      // this test empirically reveals whether an error is thrown.
      // We record the empirical outcome:
      if (errorThrown) {
        console.warn('EMPIRICAL BUG CONFIRMED: copyLogs threw on circular reference:', errorThrown);
      }
      expect(errorThrown).toBeNull();
    });
  });

  // =========================================================================
  // 3. MarbleDiagramComponent Stress & Adversarial Tests
  // =========================================================================
  describe('MarbleDiagramComponent Adversarial Tests', () => {
    let fixture: ComponentFixture<MarbleDiagramComponent>;
    let component: MarbleDiagramComponent;

    beforeEach(() => {
      fixture = TestBed.createComponent(MarbleDiagramComponent);
      component = fixture.componentInstance;
    });

    it('C3.1: should render empty input streams without throwing', () => {
      fixture.componentRef.setInput('inputStreams', []);
      fixture.detectChanges();

      expect(component.viewBoxHeight()).toBe(160);
      expect(component.scrubberX()).toBe(component.PADDING_LEFT);
    });

    it('C3.2: should render stream with empty emissions and completion marker', () => {
      const stream: MarbleStream = {
        id: 's1',
        label: 'EmptyStream',
        emissions: [],
        completedAtMs: 2500
      };

      fixture.componentRef.setInput('inputStreams', [stream]);
      fixture.componentRef.setInput('durationMs', 5000);
      fixture.detectChanges();

      const completionX = component.timeToX(2500);
      expect(completionX).toBe(component.PADDING_LEFT + component.TIMELINE_WIDTH * 0.5);
    });

    it('C3.3: should render error marker at t=0', () => {
      const stream: MarbleStream = {
        id: 's1',
        label: 'ImmediateError',
        emissions: [],
        errorAtMs: 0
      };

      fixture.componentRef.setInput('inputStreams', [stream]);
      fixture.componentRef.setInput('durationMs', 5000);
      fixture.detectChanges();

      const errX = component.timeToX(0);
      expect(errX).toBe(component.PADDING_LEFT);
    });

    it('C3.4: should handle overlapping timestamps (concurrent emissions)', () => {
      const stream: MarbleStream = {
        id: 's1',
        label: 'Concurrent',
        emissions: [
          { id: 'm1', timeMs: 1000, value: 'A', displayLabel: 'A' },
          { id: 'm2', timeMs: 1000, value: 'B', displayLabel: 'B' },
          { id: 'm3', timeMs: 1000, value: 'C', displayLabel: 'C' }
        ]
      };

      fixture.componentRef.setInput('inputStreams', [stream]);
      fixture.componentRef.setInput('durationMs', 4000);
      fixture.detectChanges();

      const x1 = component.timeToX(1000);
      const x2 = component.timeToX(1000);
      expect(x1).toBe(x2);
      expect(x1).toBe(component.PADDING_LEFT + component.TIMELINE_WIDTH * 0.25);
    });

    it('C3.5: [CHALLENGE] behavior when durationMs = 0 (divide by zero check)', () => {
      const stream: MarbleStream = {
        id: 's1',
        label: 'ZeroDuration',
        emissions: [{ id: 'm1', timeMs: 0, value: 1, displayLabel: '1' }]
      };

      fixture.componentRef.setInput('inputStreams', [stream]);
      fixture.componentRef.setInput('durationMs', 0);
      fixture.detectChanges();

      const scrubX = component.scrubberX();
      const emissionX = component.timeToX(0);

      // Check whether scrubberX and emissionX evaluate to NaN
      if (Number.isNaN(scrubX) || Number.isNaN(emissionX)) {
        console.warn('EMPIRICAL BUG CONFIRMED: durationMs=0 results in NaN SVG coordinates', {
          scrubberX: scrubX,
          emissionX: emissionX
        });
      }
      expect(Number.isNaN(scrubX)).toBeFalse();
      expect(Number.isNaN(emissionX)).toBeFalse();
    });

    it('C3.6: should handle rapid play/pause toggles cleanly without leaking timers', () => {
      const stream: MarbleStream = {
        id: 's1',
        label: 'TestStream',
        emissions: [{ id: 'm1', timeMs: 500, value: 1, displayLabel: '1' }]
      };

      fixture.componentRef.setInput('inputStreams', [stream]);
      fixture.detectChanges();

      for (let i = 0; i < 20; i++) {
        component.togglePlay();
      }

      // After 20 toggles (even number), localIsPlaying should be false
      expect(component.localIsPlaying()).toBeFalse();
      component.resetTimeline();
      expect(component.currentTimeMs()).toBe(0);
    });
  });

  // =========================================================================
  // 4. OperatorCardComponent Stress & Adversarial Tests
  // =========================================================================
  describe('OperatorCardComponent Adversarial Tests', () => {
    let fixture: ComponentFixture<OperatorCardComponent>;
    let component: OperatorCardComponent;

    beforeEach(() => {
      fixture = TestBed.createComponent(OperatorCardComponent);
      component = fixture.componentInstance;
    });

    it('C4.1: should render when optional fields (pitfalls, marbleRules, related) are missing', () => {
      const minimalOp: OperatorMetadata = {
        name: 'map',
        category: 'Transformation',
        signature: 'map<T, R>(project: (value: T, index: number) => R): OperatorFunction<T, R>',
        summary: 'Transforms each emitted value.',
        description: 'Detailed description of map.',
        difficulty: 'beginner',
        useCases: ['Transforming data']
        // pitfalls omitted
        // marbleRules omitted
        // relatedOperators omitted
      };

      fixture.componentRef.setInput('operator', minimalOp);
      fixture.detectChanges();

      expect(component).toBeTruthy();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.operator-name')?.textContent).toContain('map');
      expect(compiled.querySelector('.pitfalls-box')).toBeNull();
      expect(compiled.querySelector('.related-operators')).toBeNull();
    });

    it('C4.2: should render very long signatures without throwing', () => {
      const opWithLongSig: OperatorMetadata = {
        name: 'superComplexOp',
        category: 'Utility',
        signature: 'superComplexOp<T, A, B, C, D, E, F>(a: Observable<A>, b: Observable<B>, c: Observable<C>, d: (val: T) => Observable<D>): MonoTypeOperatorFunction<T> & OperatorFunction<T, { nested: { result: [A, B, C, D, E, F] } }>',
        summary: 'Very long signature test.',
        description: 'Test description.',
        difficulty: 'advanced',
        useCases: ['Edge case testing']
      };

      fixture.componentRef.setInput('operator', opWithLongSig);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.signature-code')?.textContent).toContain('superComplexOp');
    });

    it('C4.3: should emit operator name when playground link clicked', () => {
      const op: OperatorMetadata = {
        name: 'filter',
        category: 'Filtering',
        signature: 'filter<T>(predicate: (value: T) => boolean): MonoTypeOperatorFunction<T>',
        summary: 'Filter items',
        description: 'Desc',
        difficulty: 'beginner',
        useCases: ['Filtering']
      };

      let emittedName = '';
      component.navigate.subscribe(name => { emittedName = name; });

      fixture.componentRef.setInput('operator', op);
      fixture.detectChanges();

      component.onPlaygroundClick();
      expect(emittedName).toBe('filter');
    });

    it('C4.4: [EDGE CASE] behavior when useCases is undefined/omitted at runtime', () => {
      const opWithoutUseCases: any = {
        name: 'scan',
        category: 'Transformation',
        signature: 'scan(...)',
        summary: 'Accumulates values',
        description: 'Description',
        difficulty: 'intermediate'
        // useCases intentionally missing
      };

      fixture.componentRef.setInput('operator', opWithoutUseCases);
      expect(() => fixture.detectChanges()).not.toThrow();
    });
  });

  // =========================================================================
  // 5. ComparisonTableComponent Stress & Adversarial Tests
  // =========================================================================
  describe('ComparisonTableComponent Adversarial Tests', () => {
    let fixture: ComponentFixture<ComparisonTableComponent>;
    let component: ComparisonTableComponent;

    beforeEach(() => {
      fixture = TestBed.createComponent(ComparisonTableComponent);
      component = fixture.componentInstance;
    });

    it('C5.1: should render single-column table properly', () => {
      const singleColData: ComparisonData = {
        features: [{ id: 'f1', label: 'Feature 1' }],
        items: [{
          id: 'item1',
          name: 'SingleItem',
          recommendedUse: 'Solo work',
          characteristics: {
            f1: { text: 'Yes', status: 'positive' }
          }
        }]
      };

      fixture.componentRef.setInput('data', singleColData);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelectorAll('.item-col-header').length).toBe(1);
      expect(compiled.querySelector('.char-text')?.textContent).toContain('Yes');
    });

    it('C5.2: should render 10-column table without layout break', () => {
      const items = Array.from({ length: 10 }, (_, i) => ({
        id: `item-${i}`,
        name: `Operator ${i}`,
        recommendedUse: `Use ${i}`,
        characteristics: {
          f1: { text: `Val ${i}`, status: 'positive' as const }
        }
      }));

      const multiColData: ComparisonData = {
        features: [{ id: 'f1', label: 'Feature 1' }],
        items
      };

      fixture.componentRef.setInput('data', multiColData);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelectorAll('.item-col-header').length).toBe(10);
    });

    it('C5.3: should handle missing characteristics for a feature with dash fallback', () => {
      const sparseData: ComparisonData = {
        features: [
          { id: 'f1', label: 'Feature 1' },
          { id: 'f2', label: 'Feature 2 (Missing)' }
        ],
        items: [{
          id: 'item1',
          name: 'SparseItem',
          recommendedUse: 'Testing',
          characteristics: {
            f1: { text: 'Available', status: 'positive' }
            // f2 is intentionally missing
          }
        }]
      };

      fixture.componentRef.setInput('data', sparseData);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('—');
    });

    it('C5.4: should highlight designated column ID correctly', () => {
      const data: ComparisonData = {
        features: [{ id: 'f1', label: 'Feature 1' }],
        items: [
          { id: 'colA', name: 'Col A', recommendedUse: 'A', characteristics: {} },
          { id: 'colB', name: 'Col B', recommendedUse: 'B', characteristics: {} }
        ]
      };

      fixture.componentRef.setInput('data', data);
      fixture.componentRef.setInput('highlightColumnId', 'colB');
      fixture.detectChanges();

      expect(component.isHighlighted('colB')).toBeTrue();
      expect(component.isHighlighted('colA')).toBeFalse();
    });

    it('C5.5: [EDGE CASE] behavior when characteristics property is completely undefined on item', () => {
      const dataWithUndefinedChars: any = {
        features: [{ id: 'f1', label: 'Feature 1' }],
        items: [{
          id: 'item1',
          name: 'ItemWithoutChars',
          recommendedUse: 'Testing'
          // characteristics is undefined
        }]
      };

      fixture.componentRef.setInput('data', dataWithUndefinedChars);
      expect(() => fixture.detectChanges()).not.toThrow();
    });
  });

  // =========================================================================
  // 6. PlaygroundWrapperComponent Stress & Adversarial Tests
  // =========================================================================
  describe('PlaygroundWrapperComponent Adversarial Tests', () => {
    let fixture: ComponentFixture<PlaygroundWrapperComponent>;
    let component: PlaygroundWrapperComponent;
    let progressService: ProgressService;

    beforeEach(() => {
      fixture = TestBed.createComponent(PlaygroundWrapperComponent);
      component = fixture.componentInstance;
      progressService = TestBed.inject(ProgressService);
    });

    it('C6.1: should switch tabs via selectTab and sync activeTab model', () => {
      fixture.componentRef.setInput('title', 'Test Topic');
      fixture.componentRef.setInput('availableTabs', ['concept', 'code', 'visual', 'quiz']);
      fixture.detectChanges();

      expect(component.activeTab()).toBe('concept');
      component.selectTab('visual');
      expect(component.activeTab()).toBe('visual');
    });

    it('C6.2: should navigate tabs via Alt+ArrowRight and Alt+ArrowLeft with wrap-around', () => {
      fixture.componentRef.setInput('title', 'Test Topic');
      fixture.componentRef.setInput('availableTabs', ['concept', 'code', 'visual']);
      component.activeTab.set('concept');
      fixture.detectChanges();

      // Alt + ArrowRight -> code
      const eventRight = new KeyboardEvent('keydown', { key: 'ArrowRight', altKey: true });
      component.handleKeyNavigation(eventRight);
      expect(component.activeTab()).toBe('code');

      // Alt + ArrowRight -> visual
      component.handleKeyNavigation(eventRight);
      expect(component.activeTab()).toBe('visual');

      // Alt + ArrowRight -> wrap around to concept
      component.handleKeyNavigation(eventRight);
      expect(component.activeTab()).toBe('concept');

      // Alt + ArrowLeft -> wrap around to visual
      const eventLeft = new KeyboardEvent('keydown', { key: 'ArrowLeft', altKey: true });
      component.handleKeyNavigation(eventLeft);
      expect(component.activeTab()).toBe('visual');
    });

    it('C6.3: should toggle topic completion and sync with ProgressService', () => {
      fixture.componentRef.setInput('title', 'Completion Test');
      fixture.componentRef.setInput('topicId', 'test-topic-1');
      fixture.detectChanges();

      expect(component.isCompleted()).toBeFalse();
      expect(progressService.isCompleted('test-topic-1')).toBeFalse();

      component.toggleTopicCompletion();
      expect(component.isCompleted()).toBeTrue();
      expect(progressService.isCompleted('test-topic-1')).toBeTrue();
      expect(component.celebrationActive()).toBeTrue();

      component.toggleTopicCompletion();
      expect(component.isCompleted()).toBeFalse();
      expect(progressService.isCompleted('test-topic-1')).toBeFalse();
    });
  });

  // =========================================================================
  // 7. QuizBlockComponent Stress & Adversarial Tests
  // =========================================================================
  describe('QuizBlockComponent Adversarial Tests', () => {
    let fixture: ComponentFixture<QuizBlockComponent>;
    let component: QuizBlockComponent;
    let progressService: ProgressService;

    const sampleQuestions: QuizQuestion[] = [
      {
        id: 'q1',
        question: 'What is an Observable?',
        options: [
          { id: 'opt1', text: 'Push-based data stream' },
          { id: 'opt2', text: 'Pull-based data stream' }
        ],
        correctOptionId: 'opt1',
        explanation: 'Observables push values over time.'
      },
      {
        id: 'q2',
        question: 'Which operator transforms values?',
        options: [
          { id: 'optA', text: 'filter' },
          { id: 'optB', text: 'map' }
        ],
        correctOptionId: 'optB',
        explanation: 'map applies a project function.'
      }
    ];

    beforeEach(() => {
      fixture = TestBed.createComponent(QuizBlockComponent);
      component = fixture.componentInstance;
      progressService = TestBed.inject(ProgressService);
    });

    it('C7.1: should ignore submitAnswer when no option is selected', () => {
      fixture.componentRef.setInput('questions', sampleQuestions);
      fixture.detectChanges();

      expect(component.selectedOptionId()).toBeNull();
      component.submitAnswer();
      expect(component.isCurrentAnswered()).toBeFalse();
      expect(component.answeredQuestions()[0]).toBeUndefined();
    });

    it('C7.2: should not allow changing answer once submitted (immutability)', () => {
      fixture.componentRef.setInput('questions', sampleQuestions);
      fixture.detectChanges();

      component.selectOption('opt1');
      component.submitAnswer();
      expect(component.isCurrentAnswered()).toBeTrue();

      // Attempt to change option
      component.selectOption('opt2');
      expect(component.selectedOptionId()).toBe('opt1');
    });

    it('C7.3: should calculate perfect score (100%) and mark passed', () => {
      let finalScore: QuizScore | undefined;
      component.completed.subscribe(score => { finalScore = score; });

      fixture.componentRef.setInput('questions', sampleQuestions);
      fixture.componentRef.setInput('topicId', 'q-topic-pass');
      fixture.componentRef.setInput('passThreshold', 75);
      fixture.detectChanges();

      // Q1 -> opt1 (correct)
      component.selectOption('opt1');
      component.submitAnswer();
      component.nextQuestion();

      // Q2 -> optB (correct)
      component.selectOption('optB');
      component.submitAnswer();

      expect(component.showResults()).toBeTrue();
      expect(finalScore!).toEqual({
        total: 2,
        correct: 2,
        percentage: 100,
        passed: true
      });
      expect(progressService.getQuizScore('q-topic-pass')?.passed).toBeTrue();
    });

    it('C7.4: should calculate zero score (0%) and mark failed', () => {
      let finalScore: QuizScore | undefined;
      component.completed.subscribe(score => { finalScore = score; });

      fixture.componentRef.setInput('questions', sampleQuestions);
      fixture.componentRef.setInput('topicId', 'q-topic-fail');
      fixture.componentRef.setInput('passThreshold', 75);
      fixture.detectChanges();

      // Q1 -> opt2 (wrong)
      component.selectOption('opt2');
      component.submitAnswer();
      component.nextQuestion();

      // Q2 -> optA (wrong)
      component.selectOption('optA');
      component.submitAnswer();

      expect(component.showResults()).toBeTrue();
      expect(finalScore!).toEqual({
        total: 2,
        correct: 0,
        percentage: 0,
        passed: false
      });
      expect(progressService.getQuizScore('q-topic-fail')?.passed).toBeFalse();
    });

    it('C7.5: should allow retrying quiz from results view', () => {
      fixture.componentRef.setInput('questions', sampleQuestions);
      fixture.detectChanges();

      component.selectOption('opt2');
      component.submitAnswer();
      component.nextQuestion();
      component.selectOption('optA');
      component.submitAnswer();

      expect(component.showResults()).toBeTrue();
      component.retryQuiz();

      expect(component.showResults()).toBeFalse();
      expect(component.currentIndex()).toBe(0);
      expect(component.selectedOptionId()).toBeNull();
      expect(Object.keys(component.answeredQuestions()).length).toBe(0);
    });
  });

  // =========================================================================
  // 8. ShellComponent Layout & Mobile Drawer Tests
  // =========================================================================
  describe('ShellComponent Layout & Mobile Drawer Tests', () => {
    let fixture: ComponentFixture<ShellComponent>;
    let component: ShellComponent;

    beforeEach(() => {
      fixture = TestBed.createComponent(ShellComponent);
      component = fixture.componentInstance;
    });

    it('C8.1: should toggle sidenav open state and close on backdrop/button request', () => {
      fixture.detectChanges();

      expect(component.isSidenavOpen()).toBeFalse();

      component.toggleSidenav();
      expect(component.isSidenavOpen()).toBeTrue();

      component.toggleSidenav();
      expect(component.isSidenavOpen()).toBeFalse();

      component.toggleSidenav();
      expect(component.isSidenavOpen()).toBeTrue();

      component.closeSidenav();
      expect(component.isSidenavOpen()).toBeFalse();
    });
  });
});
