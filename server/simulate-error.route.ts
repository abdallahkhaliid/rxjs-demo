import { Request, Response } from 'express';

interface SimulateErrorQueryParams {
  rate?: string;
  delay?: string;
  statusCode?: string;
  attempt?: string;
}

export function simulateError(req: Request<unknown, unknown, unknown, SimulateErrorQueryParams>, res: Response) {
  const rawRate = Number(req.query.rate ?? 0.3);
  const rate = Math.min(Math.max(isNaN(rawRate) ? 0.3 : rawRate, 0.0), 1.0);
  const rawDelay = Number(req.query.delay ?? 0);
  const delayMs = Math.min(Math.max(isNaN(rawDelay) ? 0 : rawDelay, 0), 10000);
  const statusCode = Number(req.query.statusCode ?? 500) || 500;
  const attempt = Number(req.query.attempt ?? 1) || 1;

  const handleExecution = () => {
    const roll = Math.random();
    const isFailure = roll < rate;
    const timestamp = Date.now();

    if (isFailure) {
      res.status(statusCode).json({
        status: 'error',
        endpoint: '/api/simulate-error',
        statusCode,
        rate,
        randomRoll: Number(roll.toFixed(4)),
        attempt,
        code: 'SIMULATED_TRANSIENT_ERROR',
        message: `Simulated upstream service error (roll ${roll.toFixed(4)} < failure threshold ${rate.toFixed(4)})`,
        timestamp,
        suggestedAction: 'Retry request using exponential backoff'
      });
    } else {
      res.status(200).json({
        status: 'success',
        endpoint: '/api/simulate-error',
        rate,
        randomRoll: Number(roll.toFixed(4)),
        attempt,
        timestamp,
        message: `Request succeeded (roll ${roll.toFixed(4)} >= failure threshold ${rate.toFixed(4)})`,
        data: {
          service: 'OperationalDataStream',
          payload: 'Transaction authorized successfully'
        }
      });
    }
  };

  if (delayMs > 0) {
    setTimeout(handleExecution, delayMs);
  } else {
    handleExecution();
  }
}
