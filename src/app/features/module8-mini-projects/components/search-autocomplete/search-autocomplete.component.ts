import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, of } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  switchMap,
  tap
} from 'rxjs/operators';

import { ConsoleEntry, Lesson, PlaygroundTab } from '../../../../core/models';
import { LessonsService } from '../../../../core/services/lessons.service';
import { MODULE8_PROJECTS } from '../../module8.data';
import { MiniProjectTopicConfig } from '../../module8.models';

import { PlaygroundWrapperComponent } from '../../../../shared/components/playground-wrapper/playground-wrapper.component';
import { CodeBlockComponent } from '../../../../shared/components/code-block/code-block.component';
import { OutputConsoleComponent } from '../../../../shared/components/output-console/output-console.component';
import { ComparisonTableComponent } from '../../../../shared/components/comparison-table/comparison-table.component';
import { QuizBlockComponent } from '../../../../shared/components/quiz-block/quiz-block.component';

@Component({
  selector: 'app-search-autocomplete',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PlaygroundWrapperComponent,
    CodeBlockComponent,
    OutputConsoleComponent,
    ComparisonTableComponent,
    QuizBlockComponent
  ],
  templateUrl: './search-autocomplete.component.html',
  styleUrl: './search-autocomplete.component.scss'
})
export class SearchAutocompleteComponent implements OnInit {
  private readonly lessonsService = inject(LessonsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly config: MiniProjectTopicConfig = MODULE8_PROJECTS['search-autocomplete'];
  readonly activeTab = signal<PlaygroundTab>('visual');

  readonly searchControl = new FormControl<string>('');
  readonly debounceSlider = new FormControl<number>(300, { nonNullable: true });
  readonly simulateErrorControl = new FormControl<boolean>(false, { nonNullable: true });

  readonly results = signal<Lesson[]>([]);
  readonly totalResults = signal<number>(0);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // Telemetry metrics
  readonly keystrokeCount = signal<number>(0);
  readonly requestCount = signal<number>(0);
  readonly cancelledCount = signal<number>(0);

  readonly consoleEntries = signal<ConsoleEntry[]>([]);
  private entryIdCounter = 0;
  private readonly startTime = Date.now();

  private activeInFlight = 0;

  ngOnInit(): void {
    // Keystroke counter
    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.keystrokeCount.update(c => c + 1);
      });

    // Reactive pipeline
    this.searchControl.valueChanges
      .pipe(
        map(raw => (raw ?? '').trim()),
        debounceTime(this.debounceSlider.value),
        distinctUntilChanged(),
        tap(query => {
          this.logEntry('next', `Query changed: "${query}"`, { query });
        }),
        switchMap(query => {
          if (!query) {
            this.isLoading.set(false);
            this.errorMessage.set(null);
            this.results.set([]);
            this.totalResults.set(0);
            return of({ lessons: [], total: 0 });
          }

          if (this.activeInFlight > 0) {
            this.cancelledCount.update(c => c + 1);
            this.logEntry('info', `switchMap cancelled previous in-flight search!`);
          }

          this.isLoading.set(true);
          this.errorMessage.set(null);
          this.requestCount.update(c => c + 1);
          this.activeInFlight++;

          // Simulate 500 if toggled
          if (this.simulateErrorControl.value) {
            this.logEntry('error', `Simulating backend 500 error for query "${query}"`);
            this.activeInFlight--;
            this.isLoading.set(false);
            this.errorMessage.set('Backend 500 error simulated. Stream preserved via catchError.');
            return of({ lessons: [], total: 0 });
          }

          const encoded = encodeURIComponent(query);
          return this.lessonsService.searchLessons(encoded, undefined, 0, 10).pipe(
            tap(res => {
              this.activeInFlight = Math.max(0, this.activeInFlight - 1);
              this.logEntry('next', `Received ${res.lessons ? res.lessons.length : 0} lessons for "${query}"`);
            }),
            catchError(err => {
              this.activeInFlight = Math.max(0, this.activeInFlight - 1);
              this.logEntry('error', `Search error for "${query}": ${err.message || '500 error'}`);
              this.errorMessage.set('Search service temporarily unavailable.');
              return of({ lessons: [], total: 0 });
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(res => {
        this.isLoading.set(false);
        const capped = (res.lessons || []).slice(0, 10);
        this.results.set(capped);
        this.totalResults.set(res.total || capped.length);
      });
  }

  onKeystroke(val: string): void {
    this.searchControl.setValue(val);
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.results.set([]);
    this.totalResults.set(0);
    this.errorMessage.set(null);
  }

  clearConsole(): void {
    this.consoleEntries.set([]);
  }

  private logEntry(type: 'next' | 'error' | 'complete' | 'info', description: string, value?: any): void {
    const entry: ConsoleEntry = {
      id: `log-${++this.entryIdCounter}`,
      timestamp: Date.now(),
      relativeMs: Date.now() - this.startTime,
      type,
      streamName: 'search-stream',
      description,
      value
    };
    this.consoleEntries.update(entries => [entry, ...entries.slice(0, 19)]);
  }
}
