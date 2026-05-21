import dotenv from 'dotenv';
dotenv.config();

// Global error handlers — these MUST be registered before any other imports
// that could trigger errors. They prevent the Node process from crashing
// on uncaught exceptions or unhandled promise rejections.
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err.message);
  console.error(err.stack);
  // Give logs time to flush, then exit gracefully
  setTimeout(() => process.exit(1), 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't crash — log and continue. Railway will restart if memory leaks.
});

import { prisma } from './lib/prisma';
import { server } from './server';
import { redis } from './lib/redis';

const PORT = process.env.PORT || 3000;

// Explicitly connect to the database before starting the server
prisma.$connect()
  .then(() => {
    console.log('✅ Database connected');
    const httpServer = server.listen(PORT, () => {
      console.log(`🚀 HookSwing API running on port ${PORT}`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      httpServer.close(async () => {
        console.log('HTTP server closed.');
        try {
          await prisma.$disconnect();
          console.log('Prisma disconnected.');
        } catch (e) {
          console.error('Prisma disconnect error:', e);
        }
        try {
          await redis.quit();
          console.log('Redis disconnected.');
        } catch (e) {
          console.error('Redis disconnect error:', e);
        }
        process.exit(0);
      });

      // Force exit after 10s if graceful shutdown hangs
      setTimeout(() => {
        console.error('Force exiting after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });
