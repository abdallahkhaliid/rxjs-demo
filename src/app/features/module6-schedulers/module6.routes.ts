import { Routes } from '@angular/router';
import { EventLoopVisualizerComponent } from './event-loop-visualizer.component';
import { SchedulerTopicComponent } from './scheduler-topic.component';

export const MODULE6_ROUTES: Routes = [
  { path: '', redirectTo: 'visualizer', pathMatch: 'full' },
  { path: 'visualizer', component: EventLoopVisualizerComponent },
  {
    path: 'queue',
    component: SchedulerTopicComponent,
    data: { topicId: 'queue-scheduler' }
  },
  {
    path: 'asap',
    component: SchedulerTopicComponent,
    data: { topicId: 'asap-scheduler' }
  },
  {
    path: 'async',
    component: SchedulerTopicComponent,
    data: { topicId: 'async-scheduler' }
  },
  {
    path: 'animation-frame',
    component: SchedulerTopicComponent,
    data: { topicId: 'animation-frame-scheduler' }
  }
];
