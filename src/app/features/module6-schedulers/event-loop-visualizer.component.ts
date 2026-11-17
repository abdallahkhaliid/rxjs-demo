import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlaygroundTab, QuizScore } from '../../core/models';
import { PlaygroundWrapperComponent } from '../../shared/components/playground-wrapper/playground-wrapper.component';
import { CodeBlockComponent } from '../../shared/components/code-block/code-block.component';
import { OutputConsoleComponent } from '../../shared/components/output-console/output-console.component';
import { ComparisonTableComponent } from '../../shared/components/comparison-table/comparison-table.component';
import { QuizBlockComponent } from '../../shared/components/quiz-block/quiz-block.component';
import { EventLoopSimulatorService } from './event-loop-simulator.service';
import { SCHEDULER_COMPARISON_DATA, VISUALIZER_QUIZ } from './module6.data';
import { SchedulerId } from './module6.models';

@Component({
  selector: 'app-event-loop-visualizer',
  standalone: true,
  imports: [
    CommonModule,
    PlaygroundWrapperComponent,
    CodeBlockComponent,
    OutputConsoleComponent,
    ComparisonTableComponent,
    QuizBlockComponent
  ],
  templateUrl: './event-loop-visualizer.component.html',
  styleUrl: './event-loop-visualizer.component.scss'
})
export class EventLoopVisualizerComponent {
  readonly simulator = inject(EventLoopSimulatorService);

  readonly activeTab = signal<PlaygroundTab>('visual');
  readonly comparisonData = SCHEDULER_COMPARISON_DATA;
  readonly quizQuestions = VISUALIZER_QUIZ;

  readonly progressPercentage = computed<number>(() => {
    const total = this.simulator.totalSteps();
    if (total <= 1) return 100;
    return Math.round((this.simulator.currentStepIndex() / (total - 1)) * 100);
  });

  onScenarioChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    if (select?.value) {
      this.simulator.selectScenario(select.value);
    }
  }

  onQuizCompleted(score: QuizScore): void {
    // Handled by quiz block
  }

  getSchedulerBadge(scheduler: SchedulerId): string {
    switch (scheduler) {
      case 'queue':
        return 'queueScheduler (trampoline)';
      case 'asap':
        return 'asapScheduler (microtask)';
      case 'async':
        return 'asyncScheduler (macrotask)';
      case 'animation-frame':
        return 'animationFrameScheduler (vsync)';
      default:
        return 'sync (main script)';
    }
  }

  getSchedulerClass(scheduler: SchedulerId): string {
    switch (scheduler) {
      case 'queue':
        return 'scheduler-queue';
      case 'asap':
        return 'scheduler-asap';
      case 'async':
        return 'scheduler-async';
      case 'animation-frame':
        return 'scheduler-raf';
      default:
        return 'scheduler-sync';
    }
  }
}
