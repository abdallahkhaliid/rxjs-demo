import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PlaygroundWrapperComponent } from '../shared/components/playground-wrapper/playground-wrapper.component';
import { CodeBlockComponent } from '../shared/components/code-block/code-block.component';

@Component({
  selector: 'app-stub-topic',
  standalone: true,
  imports: [PlaygroundWrapperComponent, CodeBlockComponent],
  template: `
    <app-playground-wrapper
      [title]="topicTitle"
      subtitle="Interactive lesson workspace ready for exploration"
      category="RxJS Platform"
      difficulty="intermediate"
      [topicId]="topicId"
    >
      <div slot="concept" class="card">
        <h3>About {{ topicTitle }}</h3>
        <p>This interactive module covers reactive stream patterns, lifecycle management, and hands-on demonstrations.</p>
        <div class="badge badge-primary">Milestone Module Ready</div>
      </div>

      <div slot="code">
        <app-code-block
          [code]="sampleCode"
          language="typescript"
          [title]="topicId + '.ts'"
        />
      </div>

      <div slot="visual" class="card">
        <h3>Visual Simulation</h3>
        <p>Interactive stream timeline visualizer is being rendered for this scenario.</p>
      </div>

      <div slot="comparison" class="card">
        <h3>Pattern Comparison</h3>
        <p>Direct comparison against complementary RxJS operators and strategies.</p>
      </div>

      <div slot="quiz" class="card">
        <h3>Knowledge Check</h3>
        <p>Complete this module's interactive quiz to test your understanding.</p>
      </div>
    </app-playground-wrapper>
  `
})
export class StubTopicComponent {
  private readonly route = inject(ActivatedRoute);

  topicTitle = 'RxJS Topic';
  topicId = 'topic';

  sampleCode = `import { of, map } from 'rxjs';\n\n// Observable Stream\nof(1, 2, 3).pipe(\n  map(x => x * 10)\n).subscribe(val => console.log(val));`;

  constructor() {
    this.route.url.subscribe(segments => {
      if (segments.length > 0) {
        this.topicId = segments[segments.length - 1].path;
        this.topicTitle = this.topicId
          .replace(/-/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());
      }
    });
  }
}
