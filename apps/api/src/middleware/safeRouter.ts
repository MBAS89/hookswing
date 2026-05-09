import { Router } from 'express';
import { asyncHandler } from './asyncHandler';

/**
 * Creates an Express Router that automatically wraps async route handlers
 * with asyncHandler, so thrown errors are passed to Express error middleware
 * instead of becoming unhandled promise rejections.
 */
export function createSafeRouter(options?: Parameters<typeof Router>[0]) {
  const router = Router(options);
  const methods = ['get', 'post', 'patch', 'put', 'delete', 'all'] as const;

  for (const method of methods) {
    const original = (router as any)[method].bind(router);
    (router as any)[method] = (...args: any[]) => {
      const wrappedArgs = args.map((arg: any) => {
        if (typeof arg === 'function' && arg.constructor.name === 'AsyncFunction') {
          return asyncHandler(arg);
        }
        return arg;
      });
      return original(...wrappedArgs);
    };
  }

  return router;
}
