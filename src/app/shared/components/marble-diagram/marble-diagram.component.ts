import { Component, input, output, signal, computed, effect, OnDestroy } from '@angular/core';
import { MarbleEmission, MarbleStream } from '../../../core/models';

const MARBLE_COLORS = [
  'var(--color-marble-1)',
  'var(--color-marble-2)',
  'var(--color-marble-3)',
  'var(--color-marble-4)',
  'var(--color-marble-5)',
  'var(--color-marble-6)',
  'var(--color-marble-7)',
  'var(--color-marble-8)'
];

@Component({
  selector: 'app-marble-diagram',
  standalone: true,
  templateUrl: './marble-diagram.component.html',
  styleUrl: './marble-diagram.component.scss'
})
export class MarbleDiagramComponent implements OnDestroy {
  inputStreams = input.required<MarbleStream[]>();
  operatorName = input<string>('');
  outputStream = input<MarbleStream | null>(null);
  durationMs = input<number>(5000);
  interactive = input<boolean>(true);
  isPlaying = input<boolean>(false);
  playbackSpeed = input<number>(1);

  marbleClick = output<{ streamId: string; emission: MarbleEmission }>();
  timelineClick = output<{ streamId: string; timeMs: number }>();
  emissionChange = output<{ streamId: string; emissions: MarbleEmission[] }>();
  playToggle = output<boolean>();

  currentTimeMs = signal<number>(0);
  localIsPlaying = signal<boolean>(false);
  selectedSpeed = signal<number>(1);

  private animationFrameId: number | null = null;
  private lastTimestamp: number = 0;

  // Geometry dimensions
  readonly SVG_WIDTH = 840;
  readonly PADDING_LEFT = 110;
  readonly PADDING_RIGHT = 40;
  readonly TIMELINE_WIDTH = this.SVG_WIDTH - this.PADDING_LEFT - this.PADDING_RIGHT;
  readonly STREAM_HEIGHT = 64;

  readonly viewBoxHeight = computed(() => {
    const inputCount = this.inputStreams().length;
    const hasOp = !!this.operatorName();
    const hasOut = !!this.outputStream();
    let h = 40 + inputCount * this.STREAM_HEIGHT;
    if (hasOp) h += 50;
    if (hasOut) h += this.STREAM_HEIGHT;
    return Math.max(h + 20, 160);
  });

  readonly scrubberX = computed(() => {
    const duration = Math.max(this.durationMs() || 0, 1);
    const progress = this.currentTimeMs() / duration;
    return this.PADDING_LEFT + Math.min(Math.max(progress, 0), 1) * this.TIMELINE_WIDTH;
  });

  constructor() {
    effect(() => {
      const playing = this.isPlaying();
      this.localIsPlaying.set(playing);
      if (playing) {
        this.startScrubber();
      } else {
        this.stopScrubber();
      }
    });

    effect(() => {
      this.selectedSpeed.set(this.playbackSpeed());
    });
  }

  ngOnDestroy(): void {
    this.stopScrubber();
  }

  togglePlay(): void {
    const next = !this.localIsPlaying();
    this.localIsPlaying.set(next);
    this.playToggle.emit(next);
    if (next) {
      if (this.currentTimeMs() >= this.durationMs()) {
        this.currentTimeMs.set(0);
      }
      this.startScrubber();
    } else {
      this.stopScrubber();
    }
  }

  resetTimeline(): void {
    this.currentTimeMs.set(0);
    if (!this.localIsPlaying()) {
      this.stopScrubber();
    }
  }

  setSpeed(speed: number): void {
    this.selectedSpeed.set(speed);
  }

  private startScrubber(): void {
    this.stopScrubber();
    this.lastTimestamp = performance.now();

    const loop = (time: number) => {
      const delta = (time - this.lastTimestamp) * this.selectedSpeed();
      this.lastTimestamp = time;

      const next = this.currentTimeMs() + delta;
      if (next >= this.durationMs()) {
        this.currentTimeMs.set(this.durationMs());
        this.localIsPlaying.set(false);
        this.playToggle.emit(false);
        this.stopScrubber();
        return;
      }

      this.currentTimeMs.set(next);
      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  private stopScrubber(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  timeToX(timeMs: number): number {
    const duration = Math.max(this.durationMs() || 0, 1);
    const safeTime = Number.isFinite(timeMs) ? timeMs : 0;
    const ratio = Math.min(Math.max(safeTime / duration, 0), 1);
    return this.PADDING_LEFT + ratio * this.TIMELINE_WIDTH;
  }

  xToTime(x: number): number {
    const duration = Math.max(this.durationMs() || 0, 0);
    const safeX = Number.isFinite(x) ? x : this.PADDING_LEFT;
    const relX = Math.min(Math.max(safeX - this.PADDING_LEFT, 0), this.TIMELINE_WIDTH);
    return Math.round((relX / this.TIMELINE_WIDTH) * duration);
  }

  getStreamY(index: number): number {
    return 40 + index * this.STREAM_HEIGHT;
  }

  getOperatorBoxY(): number {
    return 30 + this.inputStreams().length * this.STREAM_HEIGHT;
  }

  getOutputStreamY(): number {
    return this.getOperatorBoxY() + (this.operatorName() ? 55 : 30);
  }

  getMarbleColor(index: number, emission: MarbleEmission): string {
    if (emission.color) return emission.color;
    return MARBLE_COLORS[index % MARBLE_COLORS.length];
  }

  onSvgClick(event: MouseEvent, streamId: string): void {
    if (!this.interactive()) return;
    const rect = (event.currentTarget as SVGElement).getBoundingClientRect();
    const clickX = ((event.clientX - rect.left) / rect.width) * this.SVG_WIDTH;
    const timeMs = this.xToTime(clickX);
    this.currentTimeMs.set(timeMs);
    this.timelineClick.emit({ streamId, timeMs });
  }

  onMarbleClick(event: MouseEvent, streamId: string, emission: MarbleEmission): void {
    event.stopPropagation();
    this.marbleClick.emit({ streamId, emission });
  }
}
