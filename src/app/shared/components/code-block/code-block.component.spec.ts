import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { CodeBlockComponent } from './code-block.component';

describe('CodeBlockComponent', () => {
  let component: CodeBlockComponent;
  let fixture: ComponentFixture<CodeBlockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeBlockComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(CodeBlockComponent);
    component = fixture.componentInstance;
  });

  it('should create and highlight code', () => {
    fixture.componentRef.setInput('code', 'const x: number = 42;');
    fixture.componentRef.setInput('language', 'typescript');
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(component.highlightedCode()).toContain('hljs-number');
    expect(component.codeLines().length).toBe(1);
  });

  it('should split line numbers accurately for multi-line snippets', () => {
    fixture.componentRef.setInput('code', 'line 1\nline 2\nline 3');
    fixture.componentRef.setInput('highlightLines', [2]);
    fixture.detectChanges();

    const lines = component.codeLines();
    expect(lines.length).toBe(3);
    expect(lines[1].isHighlighted).toBeTrue();
    expect(lines[0].isHighlighted).toBeFalse();
  });
});
