import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { OutputConsoleComponent } from './output-console.component';
import { ConsoleEntry } from '../../../core/models';

describe('OutputConsoleComponent', () => {
  let component: OutputConsoleComponent;
  let fixture: ComponentFixture<OutputConsoleComponent>;

  const mockEntries: ConsoleEntry[] = [
    { id: '1', timestamp: 1000, relativeMs: 0, type: 'subscribe', streamName: 'source$' },
    { id: '2', timestamp: 1100, relativeMs: 100, type: 'next', streamName: 'source$', value: 10 },
    { id: '3', timestamp: 1200, relativeMs: 200, type: 'complete', streamName: 'source$' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OutputConsoleComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(OutputConsoleComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('entries', mockEntries);
    fixture.detectChanges();
  });

  it('should render console entries', () => {
    expect(component).toBeTruthy();
    expect(component.visibleEntries().length).toBe(3);
  });

  it('should emit pause toggle event', () => {
    let pausedState: boolean | undefined;
    component.pause.subscribe(p => pausedState = p);

    component.togglePause();
    expect(pausedState).toBeTrue();
    expect(component.isPaused()).toBeTrue();
  });

  it('should emit clear event', () => {
    let clearEmitted = false;
    component.clear.subscribe(() => clearEmitted = true);

    component.onClear();
    expect(clearEmitted).toBeTrue();
  });

  it('should format values safely in formatValue', () => {
    expect(component.formatValue(undefined)).toBe('');
    expect(component.formatValue(null)).toBe('null');
    expect(component.formatValue('rx')).toBe('rx');
    expect(component.formatValue({ x: 1 })).toBe('{"x":1}');

    const circular: any = { tag: 'circle' };
    circular.self = circular;
    expect(() => component.formatValue(circular)).not.toThrow();
    expect(component.formatValue(circular)).toContain('[object Object]');
  });

  it('should safely execute copyLogs without throwing when entry has circular reference', async () => {
    const circular: any = { data: 'test' };
    circular.self = circular;

    fixture.componentRef.setInput('entries', [
      { id: 'c1', timestamp: 100, relativeMs: 0, type: 'next', value: circular }
    ]);
    fixture.detectChanges();

    await expectAsync(component.copyLogs()).toBeResolved();
  });
});
