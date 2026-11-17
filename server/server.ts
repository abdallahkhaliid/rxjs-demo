import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { getCourse } from './get-course.route';
import { saveCourse } from './save-course-route';
import { searchLessons } from './search-lessons.route';
import { slowResponse } from './slow.route';
import { simulateError } from './simulate-error.route';

const app = express();

app.use(cors());
app.use(express.json());

// API Endpoints
app.get('/api/courses/:id', getCourse);
app.put('/api/courses/:id', saveCourse);
app.get('/api/lessons', searchLessons);
app.get('/api/slow', slowResponse);
app.get('/api/simulate-error', simulateError);

// Resolve frontend dist path if built (serves Angular SPA in production)
const possibleDistPaths = [
  path.resolve(process.cwd(), 'dist/rxjs-demo/browser'),
  path.resolve(__dirname, '../dist/rxjs-demo/browser'),
  path.resolve(__dirname, '../../dist/rxjs-demo/browser'),
];
const distBrowserPath = possibleDistPaths.find((p) => fs.existsSync(p));

if (distBrowserPath) {
  app.use(express.static(distBrowserPath));

  // SPA fallback for Angular HTML5 client-side routing
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distBrowserPath, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.status(200).json({
      message: 'REST API is running (run npm run build to serve the Angular UI)',
      endpoints: [
        'GET /api/courses/:id',
        'PUT /api/courses/:id',
        'GET /api/lessons',
        'GET /api/slow?delay=2000',
        'GET /api/simulate-error?rate=0.3',
      ],
    });
  });
}

const port = Number(process.env['PORT'] ?? 9000);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

