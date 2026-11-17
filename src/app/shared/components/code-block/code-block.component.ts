import { Component, input, signal, computed } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import hljs from 'highlight.js';

@Component({
  selector: 'app-code-block',
  standalone: true,
  imports: [UpperCasePipe],
  templateUrl: './code-block.component.html',
  styleUrl: './code-block.component.scss'
})
export class CodeBlockComponent {
  code = input.required<string>();
  language = input<string>('typescript');
  title = input<string>('');
  showLineNumbers = input<boolean>(true);
  highlightLines = input<number[]>([]);
  collapsible = input<boolean>(false);
  maxHeight = input<string>('550px');

  copied = signal<boolean>(false);
  isCollapsed = signal<boolean>(false);

  readonly highlightedCode = computed<string>(() => {
    const raw = this.code()?.trim() || '';
    if (!raw) return '';
    try {
      return hljs.highlight(raw, {
        language: this.language(),
        ignoreIllegals: true
      }).value;
    } catch {
      return hljs.highlightAuto(raw).value;
    }
  });

  readonly codeLines = computed<{ lineNum: number; isHighlighted: boolean }[]>(() => {
    const raw = this.code() || '';
    const lineCount = raw.split('\n').length;
    const highlights = new Set(this.highlightLines());
    return Array.from({ length: lineCount }, (_, i) => ({
      lineNum: i + 1,
      isHighlighted: highlights.has(i + 1)
    }));
  });

  async copyCode(): Promise<void> {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(this.code());
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
      }
    } catch (err) {
      console.warn('Clipboard write failed', err);
    }
  }

  toggleCollapse(): void {
    if (this.collapsible()) {
      this.isCollapsed.update(c => !c);
    }
  }
}
