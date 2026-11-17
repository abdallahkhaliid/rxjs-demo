import { Component, input, output, signal, computed, inject } from '@angular/core';
import { QuizQuestion, QuizScore } from '../../../core/models';
import { ProgressService } from '../../../core/services/progress.service';

@Component({
  selector: 'app-quiz-block',
  standalone: true,
  templateUrl: './quiz-block.component.html',
  styleUrl: './quiz-block.component.scss'
})
export class QuizBlockComponent {
  private readonly progressService = inject(ProgressService);

  questions = input.required<QuizQuestion[]>();
  topicId = input<string>('');
  passThreshold = input<number>(70);

  completed = output<QuizScore>();

  currentIndex = signal<number>(0);
  selectedOptionId = signal<string | null>(null);
  answeredQuestions = signal<Record<number, { selectedId: string; isCorrect: boolean }>>({});
  showResults = signal<boolean>(false);

  readonly currentQuestion = computed<QuizQuestion | null>(() => {
    const list = this.questions();
    const idx = this.currentIndex();
    return list[idx] || null;
  });

  readonly isCurrentAnswered = computed<boolean>(() => {
    return this.answeredQuestions()[this.currentIndex()] !== undefined;
  });

  readonly currentAnswerState = computed<{ selectedId: string; isCorrect: boolean } | null>(() => {
    return this.answeredQuestions()[this.currentIndex()] || null;
  });

  readonly score = computed<QuizScore>(() => {
    const total = this.questions().length;
    if (total === 0) return { total: 0, correct: 0, percentage: 0, passed: false };

    const answers = Object.values(this.answeredQuestions());
    const correct = answers.filter(a => a.isCorrect).length;
    const percentage = Math.round((correct / total) * 100);
    const passed = percentage >= this.passThreshold();

    return { total, correct, percentage, passed };
  });

  selectOption(optionId: string): void {
    if (this.isCurrentAnswered()) return;
    this.selectedOptionId.set(optionId);
  }

  submitAnswer(): void {
    const q = this.currentQuestion();
    const selected = this.selectedOptionId();
    if (!q || !selected) return;

    const isCorrect = selected === q.correctOptionId;
    const currentMap = { ...this.answeredQuestions() };
    currentMap[this.currentIndex()] = { selectedId: selected, isCorrect };
    this.answeredQuestions.set(currentMap);

    // If all questions answered, finish quiz
    if (Object.keys(currentMap).length === this.questions().length) {
      this.finishQuiz();
    }
  }

  nextQuestion(): void {
    if (this.currentIndex() < this.questions().length - 1) {
      this.currentIndex.update(i => i + 1);
      const prevAnswer = this.answeredQuestions()[this.currentIndex()];
      this.selectedOptionId.set(prevAnswer ? prevAnswer.selectedId : null);
    } else {
      this.finishQuiz();
    }
  }

  prevQuestion(): void {
    if (this.currentIndex() > 0) {
      this.currentIndex.update(i => i - 1);
      const prevAnswer = this.answeredQuestions()[this.currentIndex()];
      this.selectedOptionId.set(prevAnswer ? prevAnswer.selectedId : null);
    }
  }

  finishQuiz(): void {
    this.showResults.set(true);
    const finalScore = this.score();
    const id = this.topicId();
    if (id) {
      this.progressService.saveQuizScore(id, finalScore);
    }
    this.completed.emit(finalScore);
  }

  retryQuiz(): void {
    this.currentIndex.set(0);
    this.selectedOptionId.set(null);
    this.answeredQuestions.set({});
    this.showResults.set(false);
  }
}
