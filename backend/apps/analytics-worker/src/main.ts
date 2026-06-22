import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

/**
 * Analytics worker bootstrap (README §2.2 / §2.9 Docker.worker).
 * Headless: no HTTP server — the BullMQ `@Processor` starts consuming on init.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    bufferLogs: false,
  });
  app.enableShutdownHooks();
  new Logger('Worker').log('Analytics worker started; consuming jobs.');

  const shutdown = async (signal: string): Promise<void> => {
    new Logger('Worker').log(`Received ${signal}, shutting down…`);
    await app.close();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

void bootstrap();
