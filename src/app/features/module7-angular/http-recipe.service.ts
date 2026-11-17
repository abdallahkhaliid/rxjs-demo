import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, of, timer, throwError, combineLatest, forkJoin } from 'rxjs';
import { map, switchMap, shareReplay, retry, catchError, startWith, tap } from 'rxjs/operators';
import { CourseWithLessons, SlowApiResponse, SimulateErrorSuccessResponse } from '../../core/models';
import { RetryAttemptLog } from './module7.models';

@Injectable({ providedIn: 'root' })
export class HttpRecipeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl =
    typeof window !== 'undefined' && window.location.hostname !== 'localhost'
      ? '/api'
      : 'http://localhost:9000/api';

  // Manual refresh Subject
  readonly refreshTrigger$ = new Subject<void>();

  // Cached Course Observable using shareReplay({ bufferSize: 1, refCount: true })
  private cachedCourse$?: Observable<CourseWithLessons>;
  private networkCallCounter = 0;

  getNetworkCallsCount(): number {
    return this.networkCallCounter;
  }

  resetNetworkCallsCount(): void {
    this.networkCallCounter = 0;
    this.cachedCourse$ = undefined;
  }

  // 1. shareReplay Caching Pipeline (F39.1, F39.B3)
  getCachedCourse(courseId = 1, useCache = true): Observable<CourseWithLessons> {
    if (!useCache) {
      return this.fetchCourseFromBackend(courseId);
    }
    if (!this.cachedCourse$) {
      this.cachedCourse$ = this.fetchCourseFromBackend(courseId).pipe(
        shareReplay({ bufferSize: 1, refCount: true })
      );
    }
    return this.cachedCourse$;
  }

  invalidateCache(): void {
    this.cachedCourse$ = undefined;
  }

  fetchCourseFromBackend(id: number): Observable<CourseWithLessons> {
    return this.http.get<CourseWithLessons>(`${this.baseUrl}/courses/${id}`).pipe(
      tap(() => {
        this.networkCallCounter++;
      }),
      catchError(err => {
        this.networkCallCounter++;
        // Graceful mock when server is not reachable
        return of({
          id,
          description: 'RxJS in Practice (Offline Resilient)',
          longDescription: 'Comprehensive reactive programming with RxJS and Angular zoneless reactivity.',
          category: 'ADVANCED',
          lessonsCount: 10,
          lessons: [
            { id: 1, description: 'Introduction to Reactive Streams', duration: '5:00', seqNo: 1, courseId: id },
            { id: 2, description: 'Higher-Order Mapping Operators', duration: '8:30', seqNo: 2, courseId: id },
            { id: 3, description: 'Reactive State Architecture', duration: '12:00', seqNo: 3, courseId: id }
          ]
        });
      })
    );
  }

  // 2. Resilient Exponential Backoff Retry Pipeline (F39.2, F39.B1, F39.B2)
  fetchWithResilientRetry(
    rate = 0.7,
    statusCode = 500,
    maxRetries = 3,
    baseDelayMs = 400,
    onAttempt?: (log: RetryAttemptLog) => void
  ): Observable<any> {
    let attemptCount = 0;

    const request$ = new Observable<any>(sub => {
      attemptCount++;
      const currentAttempt = attemptCount;
      const startTime = Date.now();

      if (onAttempt) {
        onAttempt({
          attempt: currentAttempt,
          timestamp: startTime,
          delayMs: 0,
          statusCode,
          status: 'pending'
        });
      }

      const params = new HttpParams()
        .set('rate', rate.toString())
        .set('statusCode', statusCode.toString())
        .set('attempt', currentAttempt.toString());

      const httpSub = this.http.get<SimulateErrorSuccessResponse>(`${this.baseUrl}/simulate-error`, { params }).subscribe({
        next: val => {
          if (onAttempt) {
            onAttempt({
              attempt: currentAttempt,
              timestamp: startTime,
              delayMs: 0,
              statusCode: 200,
              status: 'success'
            });
          }
          sub.next(val);
          sub.complete();
        },
        error: err => {
          const errStatus = err.status || statusCode;
          if (onAttempt) {
            onAttempt({
              attempt: currentAttempt,
              timestamp: startTime,
              delayMs: 0,
              statusCode: errStatus,
              status: 'failed',
              errorMessage: err.message || `HTTP ${errStatus} Error`
            });
          }
          sub.error(err);
        }
      });

      return () => {
        httpSub.unsubscribe();
      };
    });

    return request$.pipe(
      retry({
        count: maxRetries,
        delay: (err: any, retryAttempt: number) => {
          const status = err.status || statusCode;
          // F39.B1: Do NOT retry 4xx client errors (400, 401, 403, 404)
          if (status >= 400 && status < 500) {
            throw err;
          }
          // Exponential backoff: baseDelay * 2^(retryAttempt - 1)
          const delayTime = Math.pow(2, retryAttempt - 1) * baseDelayMs;
          return timer(delayTime);
        }
      }),
      catchError(err => {
        // F39.3: Graceful fallback on unrecoverable error
        return of({
          fallback: true,
          status: 'recovered_fallback',
          statusCode: err.status || statusCode,
          error: err.message || 'Exhausted retries or non-retryable client error',
          data: {
            message: 'Fallback payload provided after request failure',
            recoveredAt: Date.now()
          }
        });
      })
    );
  }

  // 3. Manual Refresh with switchMap (F39.4, F39.B5)
  createRefreshableCourseStream(courseId = 1): Observable<CourseWithLessons> {
    return this.refreshTrigger$.pipe(
      startWith(null),
      switchMap(() => this.fetchCourseFromBackend(courseId))
    );
  }

  triggerRefresh(): void {
    this.refreshTrigger$.next();
  }

  // 4. Parallel Combination (F39.5)
  fetchParallelAggregatedData(courseId = 1): Observable<{ course: CourseWithLessons; slowData: SlowApiResponse }> {
    const course$ = this.fetchCourseFromBackend(courseId);
    const slow$ = this.http.get<SlowApiResponse>(`${this.baseUrl}/slow?delay=800&tag=aggregated`).pipe(
      catchError(() =>
        of({
          status: 'success' as const,
          endpoint: '/api/slow',
          delay: 800,
          tag: 'offline-mock',
          requestTimestamp: Date.now(),
          responseTimestamp: Date.now() + 800,
          elapsedMs: 800,
          data: {
            message: 'Offline Telemetry Mock (Server unreachable)',
            serverTime: new Date().toISOString()
          }
        })
      )
    );

    return combineLatest([course$, slow$]).pipe(
      map(([course, slowData]) => ({ course, slowData }))
    );
  }

  // 5. Safe JSON parser for malformed payload handling (F39.B4)
  safeParseJson(text: string): { valid: boolean; data?: any; error?: string } {
    try {
      const data = JSON.parse(text);
      return { valid: true, data };
    } catch (e: any) {
      return { valid: false, error: 'INVALID_JSON', data: { raw: text } };
    }
  }
}
