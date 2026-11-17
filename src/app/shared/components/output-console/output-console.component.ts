import { Component, input, output, signal, computed, ViewChild, ElementRef, afterNextRender } from '@angular/core';
import { ConsoleEntry } from '../../../core/models';

@Component({
  selector: 'app-output-console',
  standalone: true,
  templateUrl: './output-console.component.html',
  styleUrl: './output-console.component.scss'
})
export class OutputConsoleComponent {
  @ViewChild('logViewport') logViewport?: ElementRef<HTMLDivElement>;

  title = input<string>('Live Stream Output');
  entries = input<ConsoleEntry[]>([]);
  isStreaming = input<boolean>(false);
  maxEntries = input<number>(200);
  autoScroll = input<boolean>(true);
  showTimestamps = input<boolean>(true);
  filterStream = input<string | null>(null);

  clear = output<void>();
  pause = output<boolean>();
  replay = output<void>();

  isPaused = signal<boolean>(false);
  copied = signal<boolean>(false);

  readonly visibleEntries = computed<ConsoleEntry[]>(() => {
    const all = this.entries();
    const filter = this.filterStream();
    const max = this.maxEntries();

    let filtered = all;
    if (filter) {
      filtered = all.filter(e => e.streamName === filter);
    }
    return filtered.slice(-max);
  });

  constructor() {
    afterNextRender(() => {
      if (this.autoScroll() && !this.isPaused() && this.logViewport) {
        const el = this.logViewport.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    });
  }

  togglePause(): void {
    const nextState = !this.isPaused();
    this.isPaused.set(nextState);
    this.pause.emit(nextState);
  }

  onClear(): void {
    this.clear.emit();
  }

  onReplay(): void {
    this.replay.emit();
  }

  async copyLogs(): Promise<void> {
    try {
      const lines = this.visibleEntries().map(e => {
        const time = `+${e.relativeMs}ms`;
        const stream = e.streamName ? `[${e.streamName}] ` : '';
        const val = this.formatValue(e.value);
        return `${time} ${stream}[${e.type.toUpperCase()}] ${val} ${e.description ?? ''}`;
      }).join('\n');

      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(lines);
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
      }
    } catch (e) {
      console.warn('Failed to copy logs', e);
    }
  }

  formatValue(val: any): string {
    if (val === undefined) return '';
    if (val === null) return 'null';
    if (typeof val === 'object') {
      try {
        return JSON.stringify(val);
      } catch {
        try {
          return String(val);
        } catch {
          return '[Unserializable Object]';
        }
      }
    }
    return String(val);
  }
}
