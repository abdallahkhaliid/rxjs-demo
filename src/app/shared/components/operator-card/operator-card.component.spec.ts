import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { OperatorCardComponent } from './operator-card.component';
import { OperatorMetadata } from '../../../core/models';

describe('OperatorCardComponent', () => {
  let component: OperatorCardComponent;
  let fixture: ComponentFixture<OperatorCardComponent>;

  const mockOp: OperatorMetadata = {
    name: 'switchMap',
    category: 'Transformation',
    signature: 'switchMap<T, R>(project: (value: T, index: number) => ObservableInput<R>): OperatorFunction<T, R>',
    summary: 'Projects each source value to an Observable which is merged in the output Observable, emitting values only from the most recently projected Observable.',
    description: 'On each emission the previous inner observable is cancelled.',
    difficulty: 'intermediate',
    useCases: ['Typeahead search autocomplete', 'Cancelling stale HTTP requests'],
    pitfalls: ['Do not use for mutations like payments where cancellations lose data']
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperatorCardComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OperatorCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('operator', mockOp);
    fixture.detectChanges();
  });

  it('should display operator metadata', () => {
    expect(component).toBeTruthy();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.operator-name')?.textContent).toContain('switchMap');
    expect(el.querySelector('.badge')?.textContent).toContain('Transformation');
  });

  it('should emit navigate event on playground click', () => {
    let target = '';
    component.navigate.subscribe(t => target = t);

    component.onPlaygroundClick();
    expect(target).toBe('switchMap');
  });
});
