import { Component, input, output, signal } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { OperatorMetadata } from '../../../core/models';

@Component({
  selector: 'app-operator-card',
  standalone: true,
  imports: [UpperCasePipe],
  templateUrl: './operator-card.component.html',
  styleUrl: './operator-card.component.scss'
})
export class OperatorCardComponent {
  operator = input.required<OperatorMetadata>();
  showPlaygroundLink = input<boolean>(true);
  compact = input<boolean>(false);

  navigate = output<string>();

  signatureCopied = signal<boolean>(false);

  async copySignature(): Promise<void> {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(this.operator().signature);
        this.signatureCopied.set(true);
        setTimeout(() => this.signatureCopied.set(false), 2000);
      }
    } catch (e) {
      console.warn('Failed to copy signature', e);
    }
  }

  getCategoryBadgeClass(category: string): string {
    switch (category) {
      case 'Creation': return 'badge-success';
      case 'Transformation': return 'badge-cyan';
      case 'Filtering': return 'badge-warning';
      case 'Combination': return 'badge-primary';
      case 'Multicasting': return 'badge-purple';
      case 'Utility': return 'badge-magenta';
      default: return 'badge-muted';
    }
  }

  onPlaygroundClick(): void {
    this.navigate.emit(this.operator().name);
  }
}
