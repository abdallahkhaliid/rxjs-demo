import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComparisonTableComponent } from './comparison-table.component';
import { ComparisonData } from '../../../core/models';

describe('ComparisonTableComponent', () => {
  let component: ComparisonTableComponent;
  let fixture: ComponentFixture<ComparisonTableComponent>;

  const mockData: ComparisonData = {
    features: [
      { id: 'concurrency', label: 'Concurrency Behavior', description: 'How inner observables are handled' },
      { id: 'ordering', label: 'Emission Order' }
    ],
    items: [
      {
        id: 'switchMap',
        name: 'switchMap',
        recommendedUse: 'Search typeahead and cancellation',
        characteristics: {
          concurrency: { text: 'Cancels prior', status: 'negative' },
          ordering: { text: 'Latest only', status: 'neutral' }
        }
      },
      {
        id: 'mergeMap',
        name: 'mergeMap',
        recommendedUse: 'Parallel non-blocking requests',
        characteristics: {
          concurrency: { text: 'Parallel concurrent', status: 'positive' },
          ordering: { text: 'Arrival order', status: 'neutral' }
        }
      }
    ]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComparisonTableComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(ComparisonTableComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('data', mockData);
    fixture.detectChanges();
  });

  it('should render comparison items and features', () => {
    expect(component).toBeTruthy();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('switchMap');
    expect(el.textContent).toContain('mergeMap');
    expect(el.textContent).toContain('Concurrency Behavior');
  });

  it('should identify highlighted column', () => {
    fixture.componentRef.setInput('highlightColumnId', 'switchMap');
    fixture.detectChanges();

    expect(component.isHighlighted('switchMap')).toBeTrue();
    expect(component.isHighlighted('mergeMap')).toBeFalse();
  });
});
