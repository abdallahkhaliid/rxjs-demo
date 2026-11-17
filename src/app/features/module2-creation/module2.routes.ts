import { Routes } from '@angular/router';
import { CreationPlaygroundComponent } from './creation-playground.component';

export const MODULE2_ROUTES: Routes = [
  { path: '', redirectTo: 'of', pathMatch: 'full' },
  { path: 'of', component: CreationPlaygroundComponent, data: { operatorId: 'of' } },
  { path: 'from', component: CreationPlaygroundComponent, data: { operatorId: 'from' } },
  { path: 'from-event', component: CreationPlaygroundComponent, data: { operatorId: 'fromEvent' } },
  { path: 'interval', component: CreationPlaygroundComponent, data: { operatorId: 'interval' } },
  { path: 'timer', component: CreationPlaygroundComponent, data: { operatorId: 'timer' } },
  { path: 'range', component: CreationPlaygroundComponent, data: { operatorId: 'range' } },
  { path: 'throw-error', component: CreationPlaygroundComponent, data: { operatorId: 'throwError' } },
  { path: 'defer', component: CreationPlaygroundComponent, data: { operatorId: 'defer' } },
  { path: 'empty', component: CreationPlaygroundComponent, data: { operatorId: 'empty' } },
  { path: 'never', component: CreationPlaygroundComponent, data: { operatorId: 'never' } },
  { path: 'generate', component: CreationPlaygroundComponent, data: { operatorId: 'generate' } },
  { path: 'iif', component: CreationPlaygroundComponent, data: { operatorId: 'iif' } }
];
