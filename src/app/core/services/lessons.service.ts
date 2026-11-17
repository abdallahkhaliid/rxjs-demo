import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Course, CourseWithLessons, Lesson, LessonsResponse, SlowApiResponse, SimulateErrorSuccessResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class LessonsService {
  private readonly http = inject(HttpClient);
  // Support both direct express port (9000) or proxy relative path
  private readonly baseUrl =
    typeof window !== 'undefined' && window.location.hostname !== 'localhost'
      ? '/api'
      : 'http://localhost:9000/api';

  getCourse(id: number): Observable<CourseWithLessons> {
    return this.http.get<CourseWithLessons>(`${this.baseUrl}/courses/${id}`);
  }

  saveCourse(id: number, changes: Partial<Course>): Observable<Course> {
    return this.http.put<Course>(`${this.baseUrl}/courses/${id}`, changes);
  }

  searchLessons(
    filter = '',
    courseId?: number,
    pageNumber = 0,
    pageSize = 10,
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Observable<LessonsResponse> {
    let params = new HttpParams()
      .set('filter', filter)
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString())
      .set('sortOrder', sortOrder);

    if (courseId !== undefined && !isNaN(courseId)) {
      params = params.set('courseId', courseId.toString());
    }

    return this.http.get<LessonsResponse>(`${this.baseUrl}/lessons`, { params });
  }

  getSlow(delayMs = 2000, tag = 'default'): Observable<SlowApiResponse> {
    const params = new HttpParams()
      .set('delay', delayMs.toString())
      .set('tag', tag);

    return this.http.get<SlowApiResponse>(`${this.baseUrl}/slow`, { params });
  }

  getSimulateError(rate = 0.3, attempt = 1, statusCode = 500): Observable<SimulateErrorSuccessResponse> {
    const params = new HttpParams()
      .set('rate', rate.toString())
      .set('attempt', attempt.toString())
      .set('statusCode', statusCode.toString());

    return this.http.get<SimulateErrorSuccessResponse>(`${this.baseUrl}/simulate-error`, { params });
  }
}
