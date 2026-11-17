export interface Lesson {
  id: number;
  courseId: number;
  seqNo: number;
  description: string;
  duration: string;
}

export interface Course {
  id: number;
  description: string;
  longDescription: string;
  category: string;
  lessonsCount: number;
}

export const COURSES: Course[] = [
  {
    id: 1,
    description: 'RxJS Fundamentals',
    longDescription:
      'Learn the core building blocks of RxJS: Observables, Observers, Subscriptions, Operators and Schedulers.',
    category: 'BEGINNER',
    lessonsCount: 8,
  },
  {
    id: 2,
    description: 'RxJS Operators in Depth',
    longDescription:
      'Master the most commonly used RxJS operators such as map, filter, switchMap, concatMap, mergeMap and exhaustMap.',
    category: 'INTERMEDIATE',
    lessonsCount: 8,
  },
  {
    id: 3,
    description: 'Reactive Patterns with Angular',
    longDescription:
      'Apply reactive patterns to real Angular applications: forms, routing, HTTP and component state.',
    category: 'ADVANCED',
    lessonsCount: 8,
  },
];

export const LESSONS: Lesson[] = [
  { id: 1, courseId: 1, seqNo: 1, description: 'What is Reactive Programming?', duration: '4:17' },
  { id: 2, courseId: 1, seqNo: 2, description: 'Creating Observables', duration: '6:02' },
  { id: 3, courseId: 1, seqNo: 3, description: 'Subscribing to Observables', duration: '5:31' },
  { id: 4, courseId: 1, seqNo: 4, description: 'Understanding Observers', duration: '4:48' },
  { id: 5, courseId: 1, seqNo: 5, description: 'Cold vs Hot Observables', duration: '7:12' },
  { id: 6, courseId: 1, seqNo: 6, description: 'Unsubscribing and Memory Leaks', duration: '5:55' },
  { id: 7, courseId: 1, seqNo: 7, description: 'Subjects and BehaviorSubjects', duration: '8:20' },
  { id: 8, courseId: 1, seqNo: 8, description: 'ReplaySubject and AsyncSubject', duration: '6:44' },

  { id: 9, courseId: 2, seqNo: 1, description: 'Transformation Operators: map and scan', duration: '6:10' },
  { id: 10, courseId: 2, seqNo: 2, description: 'Filtering Operators: filter and take', duration: '5:27' },
  { id: 11, courseId: 2, seqNo: 3, description: 'Combination Operators: combineLatest', duration: '7:03' },
  { id: 12, courseId: 2, seqNo: 4, description: 'Higher-Order Observables Explained', duration: '6:38' },
  { id: 13, courseId: 2, seqNo: 5, description: 'switchMap in Practice', duration: '8:15' },
  { id: 14, courseId: 2, seqNo: 6, description: 'concatMap and mergeMap', duration: '7:41' },
  { id: 15, courseId: 2, seqNo: 7, description: 'exhaustMap and Debouncing', duration: '6:22' },
  { id: 16, courseId: 2, seqNo: 8, description: 'Error Handling with catchError', duration: '5:49' },

  { id: 17, courseId: 3, seqNo: 1, description: 'Reactive Forms with RxJS', duration: '7:30' },
  { id: 18, courseId: 3, seqNo: 2, description: 'Type-Ahead Search with switchMap', duration: '9:05' },
  { id: 19, courseId: 3, seqNo: 3, description: 'Reactive Routing and Route Params', duration: '6:53' },
  { id: 20, courseId: 3, seqNo: 4, description: 'HTTP Requests and Retry Logic', duration: '8:11' },
  { id: 21, courseId: 3, seqNo: 5, description: 'Sharing Data with Subjects', duration: '6:27' },
  { id: 22, courseId: 3, seqNo: 6, description: 'Component State with BehaviorSubject', duration: '7:48' },
  { id: 23, courseId: 3, seqNo: 7, description: 'Caching with shareReplay', duration: '6:15' },
  { id: 24, courseId: 3, seqNo: 8, description: 'Testing Observables', duration: '10:02' },
];
