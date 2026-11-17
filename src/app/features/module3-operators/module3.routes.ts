import { Routes } from '@angular/router';
import { OperatorCatalogComponent } from './operator-catalog.component';

export const MODULE3_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'transformation',
    pathMatch: 'full'
  },
  {
    path: ':category',
    component: OperatorCatalogComponent
  },
  {
    path: ':category/:operatorId',
    component: OperatorCatalogComponent
  }
];
