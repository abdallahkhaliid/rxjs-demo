import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { MarbleDiagramComponent } from './marble-diagram.component';
import { MarbleStream } from '../../../core/models';

describe('MarbleDiagramComponent', () => {
  let component: MarbleDiagramComponent;
  let fixture: ComponentFixture<MarbleDiagramComponent>;

  const mockInputStreams: MarbleStream[] = [
    {
      id: 'source',
      label: 'Source',
      emissions: [
        { id: 'e1', timeMs: 1000, value: 1, displayLabel: '1' },
        { id: 'e2', timeMs: 2500, value: 2, displayLabel: '2' }
      ],
      completedAtMs: 4000
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarbleDiagramComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(MarbleDiagramComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('inputStreams', mockInputStreams);
    fixture.componentRef.setInput('operatorName', 'map(x => x * 10)');
    fixture.componentRef.setInput('durationMs', 5000);
    fixture.detectChanges();
  });

  it('should create and map time to X coordinates accurately', () => {
    expect(component).toBeTruthy();
    // At t=0ms, x = PADDING_LEFT (110)
    expect(component.timeToX(0)).toBe(110);
    // At t=5000ms (duration), x = PADDING_LEFT + TIMELINE_WIDTH (800)
    expect(component.timeToX(5000)).toBe(800);
    // Inverse mapping
    expect(component.xToTime(110)).toBe(0);
    expect(component.xToTime(800)).toBe(5000);
  });

  it('should toggle play/pause state', () => {
    expect(component.localIsPlaying()).toBeFalse();

    component.togglePlay();
    expect(component.localIsPlaying()).toBeTrue();

    component.togglePlay();
    expect(component.localIsPlaying()).toBeFalse();
  });

  it('should reset timeline', () => {
    component.currentTimeMs.set(3000);
    component.resetTimeline();
    expect(component.currentTimeMs()).toBe(0);
  });

  it('should handle durationMs = 0 safely without producing NaN coordinates', () => {
    fixture.componentRef.setInput('durationMs', 0);
    fixture.detectChanges();

    const scrubX = component.scrubberX();
    const emissionX = component.timeToX(0);

    expect(Number.isNaN(scrubX)).toBeFalse();
    expect(Number.isNaN(emissionX)).toBeFalse();
    expect(scrubX).toBe(110);
    expect(emissionX).toBe(110);
  });
});
