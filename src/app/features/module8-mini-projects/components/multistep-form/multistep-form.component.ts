import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';

import { ConsoleEntry, PlaygroundTab } from '../../../../core/models';
import { MODULE8_PROJECTS } from '../../module8.data';
import { MiniProjectTopicConfig, UserRole, WizardFormData } from '../../module8.models';
import { FormWizardService, getTopicsForRole } from '../../services/form-wizard.service';

import { PlaygroundWrapperComponent } from '../../../../shared/components/playground-wrapper/playground-wrapper.component';
import { CodeBlockComponent } from '../../../../shared/components/code-block/code-block.component';
import { OutputConsoleComponent } from '../../../../shared/components/output-console/output-console.component';
import { ComparisonTableComponent } from '../../../../shared/components/comparison-table/comparison-table.component';
import { QuizBlockComponent } from '../../../../shared/components/quiz-block/quiz-block.component';

@Component({
  selector: 'app-multistep-form-wizard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PlaygroundWrapperComponent,
    CodeBlockComponent,
    OutputConsoleComponent,
    ComparisonTableComponent,
    QuizBlockComponent
  ],
  templateUrl: './multistep-form.component.html',
  styleUrl: './multistep-form.component.scss'
})
export class MultistepFormComponent implements OnInit {
  readonly wizardService = inject(FormWizardService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly config: MiniProjectTopicConfig = MODULE8_PROJECTS['multistep-form'];
  readonly activeTab = signal<PlaygroundTab>('visual');

  readonly formData = signal<WizardFormData>(this.wizardService.currentState);
  readonly isSubmitting = signal<boolean>(false);
  readonly isSubmitted = signal<boolean>(false);
  readonly draftStatus = signal<string>('Draft saved to LocalStorage');

  readonly formStep1 = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    fullName: ['', [Validators.required]]
  });

  readonly formStep2 = this.fb.group({
    role: ['beginner' as UserRole, [Validators.required]],
    topics: this.fb.control<string[]>([], [Validators.required]),
    experienceYears: [1],
    newsletter: [true]
  });

  readonly formStep3 = this.fb.group({
    agreedToTerms: [false, [Validators.requiredTrue]],
    notes: ['']
  });

  readonly availableTopics = signal<string[]>(getTopicsForRole('beginner'));

  readonly consoleEntries = signal<ConsoleEntry[]>([]);
  private entryIdCounter = 0;
  private readonly startTime = Date.now();

  ngOnInit(): void {
    const draft = this.wizardService.currentState;
    this.patchForms(draft);
    this.availableTopics.set(getTopicsForRole(draft.step2.role));

    this.wizardService.formData$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(state => {
        this.formData.set(state);
      });

    this.wizardService.isSubmittingState$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(sub => {
        this.isSubmitting.set(sub);
      });

    this.wizardService.isSubmittedState$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(done => {
        this.isSubmitted.set(done);
        if (done) {
          this.logEntry('complete', 'Registration successfully submitted via exhaustMap!');
        }
      });

    this.formStep1.valueChanges
      .pipe(
        debounceTime(300),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(val => {
        this.wizardService.updateStep1({
          username: val.username || '',
          email: val.email || '',
          fullName: val.fullName || ''
        });
        this.draftStatus.set(`Draft saved at ${new Date().toLocaleTimeString()}`);
        this.logEntry('next', `Step 1 draft debounced & autosaved: ${val.username}`);
      });

    this.formStep2.get('role')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(newRole => {
        if (!newRole) return;
        this.availableTopics.set(getTopicsForRole(newRole as UserRole));
        this.formStep2.patchValue({ topics: [] }, { emitEvent: false });
        this.wizardService.setRole(newRole as UserRole);
        this.logEntry('info', `Role changed to "${newRole}". Dependent topics reset.`);
      });

    this.formStep2.valueChanges
      .pipe(
        debounceTime(300),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(val => {
        this.wizardService.updateStep2({
          role: val.role as UserRole,
          topics: val.topics || [],
          experienceYears: val.experienceYears || 1,
          newsletter: Boolean(val.newsletter)
        });
        this.draftStatus.set(`Draft saved at ${new Date().toLocaleTimeString()}`);
      });

    this.formStep3.valueChanges
      .pipe(
        debounceTime(300),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(val => {
        this.wizardService.updateStep3({
          agreedToTerms: Boolean(val.agreedToTerms),
          notes: val.notes || ''
        });
      });
  }

  private patchForms(draft: WizardFormData): void {
    this.formStep1.patchValue(draft.step1, { emitEvent: false });
    this.formStep2.patchValue(
      {
        role: draft.step2.role,
        topics: draft.step2.topics,
        experienceYears: draft.step2.experienceYears,
        newsletter: draft.step2.newsletter
      },
      { emitEvent: false }
    );
    this.formStep3.patchValue(draft.step3, { emitEvent: false });
  }

  goToStep(stepNumber: number): void {
    const success = this.wizardService.setStep(stepNumber);
    if (!success) {
      this.logEntry('error', `Navigation to Step ${stepNumber} blocked: previous steps incomplete.`);
    } else {
      this.logEntry('info', `Navigated to Step ${stepNumber}`);
    }
  }

  next(): void {
    const cur = this.formData().currentStep;
    if (cur === 1 && !this.formStep1.valid) {
      this.formStep1.markAllAsTouched();
      return;
    }
    if (cur === 2 && !this.formStep2.valid) {
      this.formStep2.markAllAsTouched();
      return;
    }
    this.wizardService.nextStep();
  }

  back(): void {
    this.wizardService.previousStep();
  }

  toggleTopic(topic: string): void {
    const current = this.formStep2.get('topics')?.value || [];
    const idx = current.indexOf(topic);
    let next: string[];
    if (idx > -1) {
      next = current.filter(t => t !== topic);
    } else {
      next = [...current, topic];
    }
    this.formStep2.patchValue({ topics: next });
  }

  submitForm(): void {
    if (!this.formStep3.valid) {
      this.formStep3.markAllAsTouched();
      return;
    }
    this.logEntry('info', 'Submitting registration form (exhaustMap guarded)...');
    this.wizardService.submit();
  }

  resetWizard(): void {
    this.wizardService.reset();
    const fresh = this.wizardService.currentState;
    this.patchForms(fresh);
    this.availableTopics.set(getTopicsForRole('beginner'));
    this.draftStatus.set('Fresh registration initialized');
    this.logEntry('info', 'Wizard reset to default initial state');
  }

  clearConsole(): void {
    this.consoleEntries.set([]);
  }

  private logEntry(type: 'next' | 'error' | 'complete' | 'info', description: string, value?: any): void {
    const entry: ConsoleEntry = {
      id: `log-${++this.entryIdCounter}`,
      timestamp: Date.now(),
      relativeMs: Date.now() - this.startTime,
      type,
      streamName: 'form-wizard',
      description,
      value
    };
    this.consoleEntries.update(entries => [entry, ...entries.slice(0, 19)]);
  }
}
