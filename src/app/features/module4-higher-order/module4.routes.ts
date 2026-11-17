import { Routes } from '@angular/router';
import { HooOverviewComponent } from './hoo-overview.component';
import { HooPlaygroundComponent } from './hoo-playground.component';

export const MODULE4_ROUTES: Routes = [
  { path: '', redirectTo: 'overview', pathMatch: 'full' },
  {
    path: 'overview',
    component: HooOverviewComponent,
    data: { topicId: 'hoo-overview' }
  },
  {
    path: 'switch-map',
    component: HooPlaygroundComponent,
    data: { topicId: 'switchMap', operator: 'switchMap' }
  },
  {
    path: 'merge-map',
    component: HooPlaygroundComponent,
    data: { topicId: 'mergeMap', operator: 'mergeMap' }
  },
  {
    path: 'concat-map',
    component: HooPlaygroundComponent,
    data: { topicId: 'concatMap', operator: 'concatMap' }
  },
  {
    path: 'exhaust-map',
    component: HooPlaygroundComponent,
    data: { topicId: 'exhaustMap', operator: 'exhaustMap' }
  }
];
