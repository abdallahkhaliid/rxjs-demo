import { Routes } from '@angular/router';
import { SubjectSandboxComponent } from './subject-sandbox.component';
import { SubjectDetailComponent } from './subject-detail.component';

export const MODULE5_ROUTES: Routes = [
  { path: '', redirectTo: 'sandbox', pathMatch: 'full' },
  {
    path: 'sandbox',
    component: SubjectSandboxComponent,
    data: { topicId: 'sandbox', subjectType: 'Subject' }
  },
  {
    path: 'behavior-subject',
    component: SubjectDetailComponent,
    data: { topicId: 'behavior-subject', subjectType: 'BehaviorSubject' }
  },
  {
    path: 'replay-subject',
    component: SubjectDetailComponent,
    data: { topicId: 'replay-subject', subjectType: 'ReplaySubject' }
  },
  {
    path: 'async-subject',
    component: SubjectDetailComponent,
    data: { topicId: 'async-subject', subjectType: 'AsyncSubject' }
  }
];
