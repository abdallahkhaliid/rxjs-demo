import { Routes } from '@angular/router';
import { ShellComponent } from './core/layout/shell.component';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: '',
        redirectTo: 'module1/what-is-rxjs',
        pathMatch: 'full'
      },
      {
        path: 'module1',
        loadChildren: () => import('./features/module1-fundamentals/module1.routes').then(m => m.MODULE1_ROUTES)
      },
      {
        path: 'module2',
        loadChildren: () => import('./features/module2-creation/module2.routes').then(m => m.MODULE2_ROUTES)
      },
      {
        path: 'module3',
        loadChildren: () => import('./features/module3-operators/module3.routes').then(m => m.MODULE3_ROUTES)
      },
      {
        path: 'module4',
        loadChildren: () => import('./features/module4-higher-order/module4.routes').then(m => m.MODULE4_ROUTES)
      },
      {
        path: 'module5',
        loadChildren: () => import('./features/module5-subjects/module5.routes').then(m => m.MODULE5_ROUTES)
      },
      {
        path: 'module6',
        loadChildren: () => import('./features/module6-schedulers/module6.routes').then(m => m.MODULE6_ROUTES)
      },
      {
        path: 'module7',
        loadChildren: () => import('./features/module7-angular/module7.routes').then(m => m.MODULE7_ROUTES)
      },
      {
        path: 'module8',
        loadChildren: () => import('./features/module8-mini-projects/module8.routes').then(m => m.MODULE8_ROUTES)
      },
      {
        path: '**',
        redirectTo: 'module1/what-is-rxjs'
      }
    ]
  }
];
