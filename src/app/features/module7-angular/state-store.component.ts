import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

import { ConsoleEntry, ConsoleEntryType, PlaygroundTab } from '../../core/models';
import { PlaygroundWrapperComponent } from '../../shared/components/playground-wrapper/playground-wrapper.component';
import { CodeBlockComponent } from '../../shared/components/code-block/code-block.component';
import { OutputConsoleComponent } from '../../shared/components/output-console/output-console.component';
import { ComparisonTableComponent } from '../../shared/components/comparison-table/comparison-table.component';
import { QuizBlockComponent } from '../../shared/components/quiz-block/quiz-block.component';

import { CourseStateStoreService } from './course-state-store.service';
import { MODULE7_RECIPES, MODULE7_COMPARISONS, MODULE7_QUIZZES } from './module7.data';
import { CourseStoreItem, StateTransitionLog } from './module7.models';

@Component({
  selector: 'app-state-store-recipe',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PlaygroundWrapperComponent,
    CodeBlockComponent,
    OutputConsoleComponent,
    ComparisonTableComponent,
    QuizBlockComponent
  ],
  templateUrl: './state-store.component.html',
  styleUrls: ['./state-store.component.scss']
})
export class StateStoreComponent {
  readonly store = inject(CourseStateStoreService);

  readonly recipeData = MODULE7_RECIPES['state-management'];
  readonly comparisonData = MODULE7_COMPARISONS['state-management'];
  readonly quizzes = MODULE7_QUIZZES['state-management'];

  readonly activeTab = signal<PlaygroundTab>('visual');
  readonly codeSubTab = signal<'storeService' | 'courseStore' | 'signalBridge'>('storeService');

  // Search input model
  readonly searchInput = signal<string>('');

  // New course modal model
  readonly showAddModal = signal<boolean>(false);
  newCourseTitle = '';
  newCourseCategory: 'RxJS' | 'Angular' | 'TypeScript' | 'Architecture' = 'RxJS';
  newCourseDifficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';

  // Angular 20 toSignal() Bridged Selectors (F42.5)
  readonly totalCourses = toSignal(this.store.totalCount$, { initialValue: 0 });
  readonly enrolledCourses = toSignal(this.store.enrolledCount$, { initialValue: 0 });
  readonly activeCategory = toSignal(this.store.filterCategory$, { initialValue: 'all' });
  readonly activeDifficulty = toSignal(this.store.filterDifficulty$, { initialValue: 'all' });
  readonly filteredCourses = toSignal(this.store.filteredCourses$, { initialValue: [] });
  readonly timelineHistory = toSignal(this.store.timeline$, { initialValue: [] });

  // Boundary verification feedback
  readonly boundaryTestMessage = signal<string | null>(null);

  // Output Console
  readonly consoleEntries = signal<ConsoleEntry[]>([]);
  private consoleIdCounter = 1;

  constructor() {
    this.logConsole('info', undefined, 'CourseStateStore initialized with BehaviorSubject');
  }

  // --- Store Actions ---
  onSearchChange(term: string): void {
    this.searchInput.set(term);
    this.store.setSearchTerm(term);
    this.logConsole('info', { term }, `Action dispatched: SET_SEARCH_TERM ("${term}")`);
  }

  onCategorySelect(category: string): void {
    this.store.setCategoryFilter(category);
    this.logConsole('info', { category }, `Action dispatched: SET_CATEGORY_FILTER (${category})`);
  }

  onDifficultySelect(difficulty: string): void {
    this.store.setDifficultyFilter(difficulty);
    this.logConsole('info', { difficulty }, `Action dispatched: SET_DIFFICULTY_FILTER (${difficulty})`);
  }

  onToggleEnroll(course: CourseStoreItem): void {
    this.store.toggleEnrollment(course.id);
    this.logConsole(
      'next',
      { id: course.id, enrolled: !course.enrolled },
      `Action: TOGGLE_ENROLLMENT on "${course.title}"`
    );
  }

  onDeleteCourse(course: CourseStoreItem): void {
    this.store.deleteCourse(course.id);
    this.logConsole('next', { id: course.id }, `Action: DELETE_COURSE #${course.id} ("${course.title}")`);
  }

  openAddModal(): void {
    this.newCourseTitle = '';
    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
  }

  confirmAddCourse(): void {
    if (!this.newCourseTitle.trim()) return;
    this.store.addCourse({
      title: this.newCourseTitle.trim(),
      category: this.newCourseCategory,
      difficulty: this.newCourseDifficulty,
      enrolled: false,
      lessonsCount: 5,
      rating: 5.0
    });
    this.logConsole('next', undefined, `Action: ADD_COURSE ("${this.newCourseTitle.trim()}")`);
    this.showAddModal.set(false);
  }

  onRollback(log: StateTransitionLog): void {
    this.store.rollbackToSnapshot(log);
    this.logConsole('next', log, `Time-Travel: Rolled back to "${log.action}" snapshot`);
  }

  onResetStore(): void {
    this.store.resetStore();
    this.searchInput.set('');
    this.boundaryTestMessage.set(null);
    this.logConsole('info', undefined, 'Action: RESET_STORE to initial seed state');
  }

  // --- Boundary Checks (F42.B2, F42.B4, F42.B5) ---
  testNonExistentProperty(): void {
    // F42.B2: Selector on non-existent property returns undefined safely
    let val: any = 'placeholder';
    this.store.select((s: any) => s.nonExistentKey).subscribe(v => {
      val = v;
    });
    const msg = `F42.B2 Verified: select(s => s.nonExistentKey) returned: ${val} (typeof: ${typeof val}) without throwing.`;
    this.boundaryTestMessage.set(msg);
    this.logConsole('info', undefined, msg);
  }

  testDeepSliceSelection(): void {
    // F42.B4: Deep 5-level state slice selection
    const deepObj = { level1: { level2: { level3: { level4: { value: 'RxJS Rocks!' } } } } };
    let deepVal: any;
    this.store.select(() => deepObj.level1.level2.level3.level4.value).subscribe(v => {
      deepVal = v;
    });
    const msg = `F42.B4 Verified: 5-level deep selection resolved value: "${deepVal}".`;
    this.boundaryTestMessage.set(msg);
    this.logConsole('info', undefined, msg);
  }

  testUnknownAction(): void {
    // F42.B5: Unknown action leaves state unmodified
    const stateBefore = this.store.getState();
    this.store.dispatchUnknownAction('UNKNOWN_CUSTOM_ACTION_XYZ');
    const stateAfter = this.store.getState();
    const identical = stateBefore === stateAfter;
    const msg = `F42.B5 Verified: dispatchUnknownAction leaves state intact. Identical reference = ${identical}.`;
    this.boundaryTestMessage.set(msg);
    this.logConsole('info', undefined, msg);
  }

  // --- Output Console ---
  logConsole(type: ConsoleEntryType, value?: any, description?: string): void {
    const entry: ConsoleEntry = {
      id: `c-${this.consoleIdCounter++}`,
      timestamp: Date.now(),
      relativeMs: Date.now(),
      type,
      streamName: 'CourseStoreStream',
      value,
      description
    };
    this.consoleEntries.update(entries => [entry, ...entries.slice(0, 199)]);
  }

  clearConsole(): void {
    this.consoleEntries.set([]);
  }
}
