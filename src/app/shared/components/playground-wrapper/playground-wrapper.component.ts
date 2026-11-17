import { Component, input, model, inject, signal, computed, HostListener, effect } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { PlaygroundTab, PlaygroundTabItem } from '../../../core/models';
import { ProgressService } from '../../../core/services/progress.service';

const ALL_TABS: Record<PlaygroundTab, PlaygroundTabItem> = {
  concept: { id: 'concept', label: 'Concept', icon: '📖' },
  code: { id: 'code', label: 'Code', icon: '💻' },
  visual: { id: 'visual', label: 'Visual Demo', icon: '🔮' },
  comparison: { id: 'comparison', label: 'Comparison', icon: '⚖️' },
  quiz: { id: 'quiz', label: 'Quiz', icon: '❓' }
};

@Component({
  selector: 'app-playground-wrapper',
  standalone: true,
  imports: [UpperCasePipe],
  templateUrl: './playground-wrapper.component.html',
  styleUrl: './playground-wrapper.component.scss'
})
export class PlaygroundWrapperComponent {
  private readonly progressService = inject(ProgressService);

  title = input.required<string>();
  subtitle = input<string>('');
  category = input<string>('');
  difficulty = input<'beginner' | 'intermediate' | 'advanced'>('beginner');
  topicId = input<string>('');
  availableTabs = input<PlaygroundTab[]>(['concept', 'code', 'visual', 'comparison', 'quiz']);
  activeTab = model<PlaygroundTab>('concept');

  readonly celebrationActive = signal<boolean>(false);

  readonly renderedTabs = computed<PlaygroundTabItem[]>(() => {
    return this.availableTabs().map(tabId => ALL_TABS[tabId] || { id: tabId, label: tabId, icon: '📌' });
  });

  readonly isCompleted = computed<boolean>(() => {
    const id = this.topicId();
    return id ? this.progressService.isCompleted(id) : false;
  });

  constructor() {
    effect(() => {
      const id = this.topicId();
      if (id) {
        this.progressService.setLastVisitedTopic(id);
      }
    });
  }

  selectTab(tab: PlaygroundTab): void {
    this.activeTab.set(tab);
  }

  toggleTopicCompletion(): void {
    const id = this.topicId();
    if (!id) return;

    this.progressService.toggleCompleted(id);
    if (this.progressService.isCompleted(id)) {
      this.celebrationActive.set(true);
      setTimeout(() => this.celebrationActive.set(false), 2000);
    }
  }

  @HostListener('keydown', ['$event'])
  handleKeyNavigation(event: KeyboardEvent): void {
    if (event.altKey && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
      event.preventDefault();
      const tabs = this.availableTabs();
      const currentIndex = tabs.indexOf(this.activeTab());
      if (currentIndex === -1) return;

      if (event.key === 'ArrowRight') {
        const nextIndex = (currentIndex + 1) % tabs.length;
        this.selectTab(tabs[nextIndex]);
      } else {
        const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        this.selectTab(tabs[prevIndex]);
      }
    }
  }
}
