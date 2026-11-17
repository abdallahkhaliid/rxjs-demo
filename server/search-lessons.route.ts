import { Request, Response } from 'express';
import { LESSONS } from './db-data';

interface SearchLessonsQuery {
  courseId?: string;
  filter?: string;
  sortOrder?: 'asc' | 'desc';
  pageNumber?: string;
  pageSize?: string;
}

export function searchLessons(req: Request<unknown, unknown, unknown, SearchLessonsQuery>, res: Response) {
  const courseId = Number(req.query.courseId);
  const filter = (req.query.filter ?? '').toLowerCase();
  const sortOrder = req.query.sortOrder === 'desc' ? 'desc' : 'asc';
  const pageNumber = Number(req.query.pageNumber ?? 0);
  const pageSize = Number(req.query.pageSize ?? 3);

  const lessons = LESSONS.filter(
    (lesson) =>
      (!req.query.courseId || isNaN(courseId) || lesson.courseId === courseId) &&
      lesson.description.toLowerCase().includes(filter),
  ).sort((a, b) => (sortOrder === 'asc' ? a.seqNo - b.seqNo : b.seqNo - a.seqNo));

  const start = pageNumber * pageSize;
  const page = lessons.slice(start, start + pageSize);

  res.status(200).json({
    lessons: page,
    total: lessons.length,
    pageNumber,
    pageSize,
  });
}
