import { Routes } from '@angular/router';

export const MODULE7_ROUTES: Routes = [
  { path: '', redirectTo: 'http-patterns', pathMatch: 'full' },
  {
    path: 'http-patterns',
    loadComponent: () =>
      import('./http-patterns.component').then(m => m.HttpPatternsComponent),
    data: { topicId: 'http-patterns' }
  },
  {
    path: 'reactive-forms',
    loadComponent: () =>
      import('./reactive-forms.component').then(m => m.ReactiveFormsComponent),
    data: { topicId: 'reactive-forms' }
  },
  {
    path: 'lifecycle',
    loadComponent: () =>
      import('./lifecycle-teardown.component').then(m => m.LifecycleTeardownComponent),
    data: { topicId: 'lifecycle-teardown' }
  },
  {
    path: 'state-store',
    loadComponent: () =>
      import('./state-store.component').then(m => m.StateStoreComponent),
    data: { topicId: 'state-management' }
  }
];
