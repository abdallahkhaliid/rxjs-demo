import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HooTimelineSnapshot, HooTimelineRequest, HooLifecycleState } from './module4.models';

@Component({
  standalone: true,
  selector: 'app-hoo-timeline-visualizer',
  imports: [CommonModule],
  templateUrl: './hoo-timeline-visualizer.component.html',
  styleUrls: ['./hoo-timeline-visualizer.component.scss']
})
export class HooTimelineVisualizerComponent {
  readonly snapshot = input.required<HooTimelineSnapshot>();
  readonly compact = input<boolean>(false);

  readonly stateSummary = computed(() => {
    const snap = this.snapshot();
    return {
      active: snap.activeCount,
      queued: snap.queuedCount,
      completed: snap.completedCount,
      cancelled: snap.cancelledCount,
      ignored: snap.ignoredCount,
      total: snap.requests.length,
      operator: snap.operator,
      limit: snap.concurrencyLimit
    };
  });

  trackById(index: number, req: HooTimelineRequest): number {
    return req.id;
  }

  getStateBadgeClass(state: HooLifecycleState): string {
    switch (state) {
      case 'active': return 'badge-active';
      case 'queued': return 'badge-queued';
      case 'completed': return 'badge-completed';
      case 'cancelled': return 'badge-cancelled';
      case 'ignored': return 'badge-ignored';
      default: return '';
    }
  }

  getTrackClass(state: HooLifecycleState): string {
    return `track-state-${state}`;
  }
}
