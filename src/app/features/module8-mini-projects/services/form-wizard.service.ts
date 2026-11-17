import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
import { delay, exhaustMap, map, shareReplay, tap } from 'rxjs/operators';
import { UserRole, WizardFormData, WizardStep1Data, WizardStep2Data, WizardStep3Data } from '../module8.models';

const STORAGE_KEY = 'wizard_registration_draft';

export function getTopicsForRole(role: UserRole): string[] {
  switch (role) {
    case 'advanced':
      return ['schedulers', 'custom-operators', 'concurrency', 'virtual-time'];
    case 'intermediate':
      return ['transformation', 'filtering', 'combination', 'error-handling'];
    case 'beginner':
    default:
      return ['fundamentals', 'creation', 'common-operators'];
  }
}

export function validateStep1(data: Partial<WizardStep1Data>): boolean {
  if (!data) return false;
  const usernameValid = Boolean(data.username && data.username.trim().length >= 3);
  const emailValid = Boolean(data.email && data.email.includes('@') && data.email.length >= 5);
  return usernameValid && emailValid;
}

export function validateStep2(data: Partial<WizardStep2Data>): boolean {
  if (!data) return false;
  return Boolean(data.role && data.topics && data.topics.length > 0);
}

export function validateStep3(data: Partial<WizardStep3Data>): boolean {
  if (!data) return false;
  return Boolean(data.agreedToTerms === true);
}

export function clampStep(step: number): number {
  return Math.max(1, Math.min(3, Math.round(step)));
}

export function createDefaultFormData(): WizardFormData {
  return {
    currentStep: 1,
    step1: {
      username: '',
      email: '',
      fullName: ''
    },
    step2: {
      role: 'beginner',
      topics: [],
      experienceYears: 1,
      newsletter: true
    },
    step3: {
      agreedToTerms: false,
      notes: ''
    },
    completedSteps: {
      1: false,
      2: false,
      3: false
    }
  };
}

export function loadDraftFromStorage(storageKey = STORAGE_KEY): WizardFormData {
  try {
    if (typeof localStorage === 'undefined') return createDefaultFormData();
    const raw = localStorage.getItem(storageKey);
    if (!raw) return createDefaultFormData();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return createDefaultFormData();
    return {
      currentStep: clampStep(parsed.currentStep ?? 1),
      step1: {
        username: parsed.step1?.username || '',
        email: parsed.step1?.email || '',
        fullName: parsed.step1?.fullName || ''
      },
      step2: {
        role: parsed.step2?.role || 'beginner',
        topics: Array.isArray(parsed.step2?.topics) ? parsed.step2.topics : [],
        experienceYears: parsed.step2?.experienceYears ?? 1,
        newsletter: parsed.step2?.newsletter ?? true
      },
      step3: {
        agreedToTerms: Boolean(parsed.step3?.agreedToTerms),
        notes: parsed.step3?.notes || ''
      },
      completedSteps: parsed.completedSteps || { 1: false, 2: false, 3: false }
    };
  } catch {
    return createDefaultFormData();
  }
}

@Injectable({
  providedIn: 'root'
})
export class FormWizardService {
  private readonly state$ = new BehaviorSubject<WizardFormData>(loadDraftFromStorage());
  private readonly isSubmitting$ = new BehaviorSubject<boolean>(false);
  private readonly isSubmitted$ = new BehaviorSubject<boolean>(false);
  private readonly submitTrigger$ = new Subject<WizardFormData>();

  readonly formData$: Observable<WizardFormData> = this.state$.asObservable();
  readonly isSubmittingState$: Observable<boolean> = this.isSubmitting$.asObservable();
  readonly isSubmittedState$: Observable<boolean> = this.isSubmitted$.asObservable();

  // exhaustMap submission stream guarding against double submit
  readonly submissionResult$: Observable<{ success: boolean; data: WizardFormData }> = this.submitTrigger$.pipe(
    exhaustMap(formData => {
      this.isSubmitting$.next(true);
      // Simulate network request with 30ms delay
      return of({ success: true, data: formData }).pipe(
        delay(30),
        tap(() => {
          this.isSubmitting$.next(false);
          this.isSubmitted$.next(true);
          this.clearStorage();
        })
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor() {
    this.submissionResult$.subscribe();
  }

  get currentState(): WizardFormData {
    return this.state$.value;
  }

  canAdvanceTo(targetStep: number): boolean {
    const clampedTarget = clampStep(targetStep);
    const { completedSteps } = this.state$.value;
    for (let s = 1; s < clampedTarget; s++) {
      if (!completedSteps[s]) return false;
    }
    return true;
  }

  setStep(targetStep: number): boolean {
    const clamped = clampStep(targetStep);
    if (clamped > this.state$.value.currentStep && !this.canAdvanceTo(clamped)) {
      return false;
    }
    this.updateState({ currentStep: clamped });
    return true;
  }

  nextStep(): boolean {
    return this.setStep(this.state$.value.currentStep + 1);
  }

  previousStep(): boolean {
    return this.setStep(this.state$.value.currentStep - 1);
  }

  updateStep1(data: Partial<WizardStep1Data>): void {
    const current = this.state$.value;
    const updatedStep1: WizardStep1Data = { ...current.step1, ...data };
    const isValid = validateStep1(updatedStep1);
    this.updateState({
      step1: updatedStep1,
      completedSteps: { ...current.completedSteps, 1: isValid }
    });
  }

  setRole(newRole: UserRole): void {
    const current = this.state$.value;
    if (current.step2.role === newRole) return;
    // Reset topics to empty array upon role change (F48.B4)
    const updatedStep2: WizardStep2Data = {
      ...current.step2,
      role: newRole,
      topics: []
    };
    const isValid = validateStep2(updatedStep2);
    this.updateState({
      step2: updatedStep2,
      completedSteps: { ...current.completedSteps, 2: isValid }
    });
  }

  updateStep2(data: Partial<WizardStep2Data>): void {
    const current = this.state$.value;
    const updatedStep2: WizardStep2Data = { ...current.step2, ...data };
    const isValid = validateStep2(updatedStep2);
    this.updateState({
      step2: updatedStep2,
      completedSteps: { ...current.completedSteps, 2: isValid }
    });
  }

  updateStep3(data: Partial<WizardStep3Data>): void {
    const current = this.state$.value;
    const updatedStep3: WizardStep3Data = { ...current.step3, ...data };
    const isValid = validateStep3(updatedStep3);
    this.updateState({
      step3: updatedStep3,
      completedSteps: { ...current.completedSteps, 3: isValid }
    });
  }

  submit(): void {
    const current = this.state$.value;
    if (validateStep1(current.step1) && validateStep2(current.step2) && validateStep3(current.step3)) {
      this.submitTrigger$.next(current);
    }
  }

  reset(): void {
    const fresh = createDefaultFormData();
    this.isSubmitted$.next(false);
    this.isSubmitting$.next(false);
    this.clearStorage();
    this.state$.next(fresh);
  }

  private updateState(partial: Partial<WizardFormData>): void {
    const nextState: WizardFormData = {
      ...this.state$.value,
      ...partial
    };
    this.state$.next(nextState);
    this.saveToStorage(nextState);
  }

  private saveToStorage(state: WizardFormData): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }
    } catch {
      // Ignore storage errors safely
    }
  }

  private clearStorage(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors safely
    }
  }
}
