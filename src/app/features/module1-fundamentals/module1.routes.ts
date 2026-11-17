import { Routes } from '@angular/router';
import { FundamentalTopicComponent } from './fundamental-topic.component';

export const MODULE1_ROUTES: Routes = [
  { path: '', redirectTo: 'what-is-rxjs', pathMatch: 'full' },
  { path: 'what-is-rxjs', component: FundamentalTopicComponent, data: { topicId: 'what-is-rxjs' } },
  { path: 'what-is-observable', component: FundamentalTopicComponent, data: { topicId: 'what-is-observable' } },
  { path: 'observable-vs-promise', component: FundamentalTopicComponent, data: { topicId: 'observable-vs-promise' } },
  { path: 'observer-subscriber', component: FundamentalTopicComponent, data: { topicId: 'observer-subscriber' } },
  { path: 'subscription-lifecycle', component: FundamentalTopicComponent, data: { topicId: 'subscription-lifecycle' } },
  { path: 'cold-vs-hot', component: FundamentalTopicComponent, data: { topicId: 'cold-vs-hot' } },
  { path: 'multicasting', component: FundamentalTopicComponent, data: { topicId: 'multicasting' } }
];
