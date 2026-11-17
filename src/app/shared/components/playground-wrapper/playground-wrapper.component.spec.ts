import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { PlaygroundWrapperComponent } from './playground-wrapper.component';
import { ProgressService } from '../../../core/services/progress.service';

describe('PlaygroundWrapperComponent', () => {
  let component: PlaygroundWrapperComponent;
  let fixture: ComponentFixture<PlaygroundWrapperComponent>;
  let progressService: ProgressService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [PlaygroundWrapperComponent],
      providers: [
        provideZonelessChangeDetection(),
        ProgressService
      ]
    }).compileComponents();

    progressService = TestBed.inject(ProgressService);
    progressService.resetProgress();

    fixture = TestBed.createComponent(PlaygroundWrapperComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Test Topic Title');
    fixture.componentRef.setInput('topicId', 'test-topic-id');
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with default active tab as concept', () => {
    expect(component).toBeTruthy();
    expect(component.activeTab()).toBe('concept');
  });

  it('should switch active tab when selected', () => {
    component.selectTab('code');
    expect(component.activeTab()).toBe('code');
  });

  it('should toggle topic completion and synchronize with ProgressService', () => {
    expect(component.isCompleted()).toBeFalse();

    component.toggleTopicCompletion();
    expect(progressService.isCompleted('test-topic-id')).toBeTrue();
    expect(component.isCompleted()).toBeTrue();

    component.toggleTopicCompletion();
    expect(progressService.isCompleted('test-topic-id')).toBeFalse();
    expect(component.isCompleted()).toBeFalse();
  });
});
