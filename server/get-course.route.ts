import { Request, Response } from 'express';
import { COURSES, LESSONS } from './db-data';

export function getCourse(req: Request<{ id: string }>, res: Response) {
  const courseId = Number(req.params.id);
  const course = COURSES.find((c) => c.id === courseId);

  if (!course) {
    res.status(404).json({ message: `Course ${courseId} was not found` });
    return;
  }

  const lessons = LESSONS.filter((lesson) => lesson.courseId === courseId);

  res.status(200).json({ ...course, lessons });
}
