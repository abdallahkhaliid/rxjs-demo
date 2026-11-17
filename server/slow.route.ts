import { Request, Response } from 'express';

interface SlowQueryParams {
  delay?: string;
  tag?: string;
}

export function slowResponse(req: Request<unknown, unknown, unknown, SlowQueryParams>, res: Response) {
  const rawDelay = Number(req.query.delay ?? 2000);
  const delayMs = Math.min(Math.max(isNaN(rawDelay) ? 2000 : rawDelay, 0), 15000);
  const tag = req.query.tag ?? 'default';
  const requestTimestamp = Date.now();

  setTimeout(() => {
    const responseTimestamp = Date.now();
    res.status(200).json({
      status: 'success',
      endpoint: '/api/slow',
      delay: delayMs,
      tag,
      requestTimestamp,
      responseTimestamp,
      elapsedMs: responseTimestamp - requestTimestamp,
      data: {
        message: `Response delivered successfully after ${delayMs}ms delay`,
        serverTime: new Date(responseTimestamp).toISOString()
      }
    });
  }, delayMs);
}
