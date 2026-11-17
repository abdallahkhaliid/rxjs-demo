import { Component, inject, signal, computed, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, of, timer } from 'rxjs';
import { debounce, distinctUntilChanged, filter, switchMap, tap, catchError, map, startWith } from 'rxjs/operators';

import { ConsoleEntry, ConsoleEntryType, PlaygroundTab } from '../../core/models';
import { PlaygroundWrapperComponent } from '../../shared/components/playground-wrapper/playground-wrapper.component';
import { CodeBlockComponent } from '../../shared/components/code-block/code-block.component';
import { OutputConsoleComponent } from '../../shared/components/output-console/output-console.component';
import { ComparisonTableComponent } from '../../shared/components/comparison-table/comparison-table.component';
import { QuizBlockComponent } from '../../shared/components/quiz-block/quiz-block.component';

import { MODULE7_RECIPES, MODULE7_COMPARISONS, MODULE7_QUIZZES } from './module7.data';
import { AutoSaveStatus, FormTelemetry } from './module7.models';

const SUBCATEGORY_MAP: Record<string, string[]> = {
  Frontend: ['Angular', 'RxJS', 'TypeScript', 'React', 'Vue'],
  Backend: ['Node.js', 'NestJS', 'Express', 'Go', 'Python'],
  DevOps: ['Docker', 'Kubernetes', 'CI/CD Pipelines', 'Terraform'],
  Mobile: ['Ionic', 'React Native', 'Flutter', 'Swift']
};

@Component({
  selector: 'app-reactive-forms-recipe',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PlaygroundWrapperComponent,
    CodeBlockComponent,
    OutputConsoleComponent,
    ComparisonTableComponent,
    QuizBlockComponent
  ],
  templateUrl: './reactive-forms.component.html',
  styleUrls: ['./reactive-forms.component.scss']
})
export class ReactiveFormsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  readonly recipeData = MODULE7_RECIPES['reactive-forms'];
  readonly comparisonData = MODULE7_COMPARISONS['reactive-forms'];
  readonly quizzes = MODULE7_QUIZZES['reactive-forms'];

  readonly activeTab = signal<PlaygroundTab>('visual');
  readonly codeSubTab = signal<'pipeline' | 'crossField' | 'validation'>('pipeline');

  // Form definition
  readonly form: FormGroup = this.fb.group({
    title: ['Mastering RxJS Patterns in Angular', [Validators.required, Validators.minLength(3)]],
    category: ['Frontend', Validators.required],
    subCategory: ['Angular', Validators.required],
    description: ['Comprehensive course on reactive architecture, error backoff, and zoneless performance.', [Validators.required, Validators.maxLength(10000)]],
    difficulty: ['intermediate', Validators.required],
    autoSaveEnabled: [true]
  });

  // Dynamic subcategories signal
  readonly subCategories = signal<string[]>(SUBCATEGORY_MAP['Frontend']);

  // Auto-Save State Machine
  readonly saveStatus = signal<AutoSaveStatus>('pristine');
  readonly lastSavedAt = signal<number | null>(null);

  // Debounce Configuration
  readonly debounceDurationMs = signal<number>(400);

  // Telemetry
  readonly telemetry = signal<FormTelemetry>({
    keystrokesCount: 0,
    valueChangesCount: 0,
    httpRequestsCount: 0,
    cancelledRequestsCount: 0
  });

  // Calculate efficiency percentage
  readonly efficiencyPercentage = computed(() => {
    const t = this.telemetry();
    if (t.keystrokesCount === 0) return 0;
    const saved = Math.max(0, t.keystrokesCount - t.httpRequestsCount);
    return Math.round((saved / t.keystrokesCount) * 100);
  });

  // Output Console
  readonly consoleEntries = signal<ConsoleEntry[]>([]);
  private consoleIdCounter = 1;

  // Custom trigger for re-configuring debounce pipeline dynamically
  private readonly debounceTrigger$ = new Subject<number>();

  ngOnInit(): void {
    // 1. Cross-field dependency: Category -> SubCategory (F40.5)
    this.form.get('category')!.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
      startWith(this.form.get('category')!.value),
      map(cat => SUBCATEGORY_MAP[cat] || [])
    ).subscribe(subCats => {
      this.subCategories.set(subCats);
      const currentSub = this.form.get('subCategory')!.value;
      if (!subCats.includes(currentSub) && subCats.length > 0) {
        this.form.get('subCategory')!.setValue(subCats[0], { emitEvent: true });
      }
      this.logConsole('info', undefined, `Category changed to: ${this.form.get('category')!.value}. Updated options.`);
    });

    // 2. Setup the reactive auto-save pipeline (F40.1, F40.2, F40.3, F40.4)
    this.setupAutoSavePipeline();
  }

  private setupAutoSavePipeline(): void {
    let pendingRequest = false;

    this.form.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(() => {
        this.telemetry.update(t => ({
          ...t,
          keystrokesCount: t.keystrokesCount + 1,
          valueChangesCount: t.valueChangesCount + 1
        }));

        if (this.form.get('autoSaveEnabled')?.value) {
          this.saveStatus.set('typing');
        }
      }),
      // Dynamic debounce duration
      debounce(() => timer(this.debounceDurationMs())),
      // F40.2: Suppress duplicate payloads
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      // F40.3: Filter invalid states
      filter(val => {
        if (!val.autoSaveEnabled) {
          this.saveStatus.set('pristine');
          return false;
        }
        const isValid = this.form.valid;
        if (!isValid) {
          this.saveStatus.set('error');
          this.logConsole('error', undefined, 'Auto-save skipped: Form validation failed (invalid inputs)');
        }
        return isValid;
      }),
      tap(() => {
        if (pendingRequest) {
          // F40.4: Previous request cancelled
          this.telemetry.update(t => ({
            ...t,
            cancelledRequestsCount: t.cancelledRequestsCount + 1
          }));
          this.logConsole('info', undefined, 'switchMap cancelled previous pending HTTP PUT save');
        }
        pendingRequest = true;
        this.saveStatus.set('saving');
        this.telemetry.update(t => ({
          ...t,
          httpRequestsCount: t.httpRequestsCount + 1
        }));
        this.logConsole('info', this.form.value, 'Auto-save initiating HTTP PUT /api/courses/1...');
      }),
      // F40.4: switchMap to HTTP save
      switchMap(payload => {
        return this.saveToBackend(payload).pipe(
          catchError(err => {
            pendingRequest = false;
            this.saveStatus.set('error');
            this.logConsole('error', err, `Save failed: ${err.message}`);
            return of(null);
          })
        );
      })
    ).subscribe(result => {
      pendingRequest = false;
      if (result) {
        this.saveStatus.set('saved');
        const now = Date.now();
        this.lastSavedAt.set(now);
        this.telemetry.update(t => ({ ...t, lastSavedAt: now }));
        this.logConsole('complete', result, 'Auto-save completed successfully (HTTP 200 OK)');
      }
    });
  }

  private saveToBackend(payload: any) {
    const body = {
      description: payload.title,
      longDescription: payload.description,
      category: payload.category
    };

    const url =
      typeof window !== 'undefined' && window.location.hostname !== 'localhost'
        ? '/api/courses/1'
        : 'http://localhost:9000/api/courses/1';

    return this.http.put(url, body).pipe(
      catchError(() => {
        // Fallback mock if backend server is not running
        return of({
          id: 1,
          description: payload.title,
          longDescription: payload.description,
          category: payload.category,
          lessonsCount: 10
        });
      })
    );
  }

  // --- Manual Actions ---
  onDebounceChange(ms: any): void {
    const num = Number(ms) || 400;
    this.debounceDurationMs.set(num);
    this.logConsole('info', undefined, `Debounce window updated to ${num}ms`);
  }

  forceSaveNow(): void {
    if (!this.form.valid) {
      this.saveStatus.set('error');
      this.logConsole('error', undefined, 'Manual save rejected: Form is invalid');
      return;
    }
    this.saveStatus.set('saving');
    this.telemetry.update(t => ({ ...t, httpRequestsCount: t.httpRequestsCount + 1 }));
    this.saveToBackend(this.form.value).subscribe(() => {
      this.saveStatus.set('saved');
      this.lastSavedAt.set(Date.now());
      this.logConsole('complete', this.form.value, 'Manual save succeeded');
    });
  }

  resetForm(): void {
    this.form.reset({
      title: 'Mastering RxJS Patterns in Angular',
      category: 'Frontend',
      subCategory: 'Angular',
      description: 'Comprehensive course on reactive architecture, error backoff, and zoneless performance.',
      difficulty: 'intermediate',
      autoSaveEnabled: true
    });
    this.saveStatus.set('pristine');
    this.telemetry.set({
      keystrokesCount: 0,
      valueChangesCount: 0,
      httpRequestsCount: 0,
      cancelledRequestsCount: 0
    });
    this.logConsole('info', undefined, 'Form reset to default state');
  }

  // --- Output Console ---
  logConsole(type: ConsoleEntryType, value?: any, description?: string): void {
    const entry: ConsoleEntry = {
      id: `c-${this.consoleIdCounter++}`,
      timestamp: Date.now(),
      relativeMs: Date.now(),
      type,
      streamName: 'ReactiveFormsStream',
      value,
      description
    };
    this.consoleEntries.update(entries => [entry, ...entries.slice(0, 199)]);
  }

  clearConsole(): void {
    this.consoleEntries.set([]);
  }
}
