import { Request, Response } from 'express';
import { Course, COURSES } from './db-data';

export function saveCourse(req: Request<{ id: string }, unknown, Partial<Course>>, res: Response) {
  const courseId = Number(req.params.id);
  const course = COURSES.find((c) => c.id === courseId);

  if (!course) {
    res.status(404).json({ message: `Course ${courseId} was not found` });
    return;
  }

  Object.assign(course, req.body);

  res.status(200).json(course);
}
