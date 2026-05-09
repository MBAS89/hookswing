import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('[errorHandler]', err.name || 'Error:', err.message);

  // Prisma connection pool exhausted
  if (err.message?.includes('P2024') || err.message?.includes('Timed out fetching a new connection')) {
    return res.status(503).json({
      error: 'Service temporarily overloaded. Please try again in a moment.',
    });
  }

  // Prisma unique constraint violation
  if (err.message?.includes('P2002')) {
    return res.status(409).json({
      error: 'A record with this value already exists.',
    });
  }

  // Prisma record not found
  if (err.message?.includes('P2025')) {
    return res.status(404).json({
      error: 'Record not found.',
    });
  }

  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
}
