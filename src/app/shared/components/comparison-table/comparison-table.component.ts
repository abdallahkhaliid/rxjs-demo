import { Component, input } from '@angular/core';
import { ComparisonData } from '../../../core/models';

@Component({
  selector: 'app-comparison-table',
  standalone: true,
  templateUrl: './comparison-table.component.html',
  styleUrl: './comparison-table.component.scss'
})
export class ComparisonTableComponent {
  data = input.required<ComparisonData>();
  highlightColumnId = input<string | null>(null);

  isHighlighted(itemId: string): boolean {
    return this.highlightColumnId() === itemId;
  }
}
