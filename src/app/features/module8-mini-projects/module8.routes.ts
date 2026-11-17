import { Routes } from '@angular/router';

export const MODULE8_ROUTES: Routes = [
  { path: '', redirectTo: 'search-autocomplete', pathMatch: 'full' },
  {
    path: 'search-autocomplete',
    loadComponent: () =>
      import('./components/search-autocomplete/search-autocomplete.component').then(
        m => m.SearchAutocompleteComponent
      )
  },
  {
    path: 'live-dashboard',
    loadComponent: () =>
      import('./components/live-dashboard/live-dashboard.component').then(
        m => m.LiveDashboardComponent
      )
  },
  {
    path: 'shopping-cart',
    loadComponent: () =>
      import('./components/shopping-cart/shopping-cart.component').then(
        m => m.ShoppingCartComponent
      )
  },
  {
    path: 'http-manager',
    loadComponent: () =>
      import('./components/http-manager/http-manager.component').then(
        m => m.HttpManagerComponent
      )
  },
  {
    path: 'polling-system',
    loadComponent: () =>
      import('./components/polling-system/polling-system.component').then(
        m => m.PollingSystemComponent
      )
  },
  {
    path: 'multistep-form',
    loadComponent: () =>
      import('./components/multistep-form/multistep-form.component').then(
        m => m.MultistepFormComponent
      )
  },
  // Deep-nested breadcrumb alias: /module8/mini-projects/:project -> /module8/:project
  {
    path: 'mini-projects/:project',
    redirectTo: ':project'
  }
];
