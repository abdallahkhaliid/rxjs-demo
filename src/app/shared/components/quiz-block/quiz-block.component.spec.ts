import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { QuizBlockComponent } from './quiz-block.component';
import { QuizQuestion } from '../../../core/models';

describe('QuizBlockComponent', () => {
  let component: QuizBlockComponent;
  let fixture: ComponentFixture<QuizBlockComponent>;

  const mockQuestions: QuizQuestion[] = [
    {
      id: 'q1',
      question: 'What is an Observable?',
      options: [
        { id: 'opt1', text: 'A push-based stream of multiple values over time' },
        { id: 'opt2', text: 'A single resolved promise' }
      ],
      correctOptionId: 'opt1',
      explanation: 'Observables are lazy push collections.'
    },
    {
      id: 'q2',
      question: 'Which operator flattens by cancelling in-flight requests?',
      options: [
        { id: 'optA', text: 'mergeMap' },
        { id: 'optB', text: 'switchMap' }
      ],
      correctOptionId: 'optB',
      explanation: 'switchMap cancels the previous inner observable.'
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuizBlockComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(QuizBlockComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('questions', mockQuestions);
    fixture.componentRef.setInput('topicId', 'test-topic');
    fixture.detectChanges();
  });

  it('should initialize on question 1', () => {
    expect(component).toBeTruthy();
    expect(component.currentIndex()).toBe(0);
    expect(component.currentQuestion()?.id).toBe('q1');
  });

  it('should grade correct answers and calculate score percentage', () => {
    component.selectOption('opt1');
    component.submitAnswer();

    expect(component.isCurrentAnswered()).toBeTrue();
    expect(component.currentAnswerState()?.isCorrect).toBeTrue();

    component.nextQuestion();
    expect(component.currentIndex()).toBe(1);

    component.selectOption('optB');
    component.submitAnswer();

    const score = component.score();
    expect(score.total).toBe(2);
    expect(score.correct).toBe(2);
    expect(score.percentage).toBe(100);
    expect(score.passed).toBeTrue();
    expect(component.showResults()).toBeTrue();
  });
});
