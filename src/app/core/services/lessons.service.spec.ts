import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { LessonsService } from './lessons.service';

describe('LessonsService', () => {
  let service: LessonsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        LessonsService
      ]
    });
    service = TestBed.inject(LessonsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should call GET /api/slow with delay and tag parameters', () => {
    service.getSlow(1500, 'test-tag').subscribe(res => {
      expect(res.status).toBe('success');
      expect(res.delay).toBe(1500);
    });

    const req = httpMock.expectOne(req =>
      req.url === 'http://localhost:9000/api/slow' &&
      req.params.get('delay') === '1500' &&
      req.params.get('tag') === 'test-tag'
    );
    expect(req.request.method).toBe('GET');

    req.flush({
      status: 'success',
      endpoint: '/api/slow',
      delay: 1500,
      tag: 'test-tag',
      requestTimestamp: Date.now(),
      responseTimestamp: Date.now() + 1500,
      elapsedMs: 1500,
      data: { message: 'ok', serverTime: new Date().toISOString() }
    });
  });

  it('should call GET /api/simulate-error with rate and attempt parameters', () => {
    service.getSimulateError(0.5, 2).subscribe(res => {
      expect(res.status).toBe('success');
      expect(res.rate).toBe(0.5);
    });

    const req = httpMock.expectOne(req =>
      req.url === 'http://localhost:9000/api/simulate-error' &&
      req.params.get('rate') === '0.5' &&
      req.params.get('attempt') === '2'
    );
    expect(req.request.method).toBe('GET');

    req.flush({
      status: 'success',
      endpoint: '/api/simulate-error',
      rate: 0.5,
      randomRoll: 0.8,
      attempt: 2,
      timestamp: Date.now(),
      message: 'ok',
      data: {}
    });
  });

  it('should call GET /api/lessons with filter and optional courseId', () => {
    service.searchLessons('switchMap').subscribe(res => {
      expect(res.lessons.length).toBe(1);
    });

    const req = httpMock.expectOne(req =>
      req.url === 'http://localhost:9000/api/lessons' &&
      req.params.get('filter') === 'switchMap' &&
      !req.params.has('courseId')
    );
    expect(req.request.method).toBe('GET');

    req.flush({
      lessons: [{ id: 1, description: 'switchMap lesson', duration: '5:00', seqNo: 1, courseId: 1 }],
      total: 1,
      pageNumber: 0,
      pageSize: 10
    });
  });

  it('should call GET /api/courses/:id and return flattened CourseWithLessons', () => {
    service.getCourse(1).subscribe(res => {
      expect(res.id).toBe(1);
      expect(res.description).toBe('RxJS Fundamentals');
      expect(res.lessons.length).toBe(1);
      expect(res.lessons[0].description).toBe('What is Reactive Programming?');
    });

    const req = httpMock.expectOne('http://localhost:9000/api/courses/1');
    expect(req.request.method).toBe('GET');

    req.flush({
      id: 1,
      description: 'RxJS Fundamentals',
      longDescription: 'Learn the core building blocks of RxJS',
      category: 'BEGINNER',
      lessonsCount: 8,
      lessons: [
        { id: 1, courseId: 1, seqNo: 1, description: 'What is Reactive Programming?', duration: '4:17' }
      ]
    });
  });

  it('should call PUT /api/courses/:id and return updated Course', () => {
    service.saveCourse(1, { description: 'Updated RxJS' }).subscribe(res => {
      expect(res.description).toBe('Updated RxJS');
    });

    const req = httpMock.expectOne('http://localhost:9000/api/courses/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ description: 'Updated RxJS' });

    req.flush({
      id: 1,
      description: 'Updated RxJS',
      longDescription: 'Learn the core building blocks of RxJS',
      category: 'BEGINNER',
      lessonsCount: 8
    });
  });
});
