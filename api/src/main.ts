import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { env } from './env.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Lets DatabaseModule.onModuleDestroy close the pool on SIGTERM, so dev
  // restarts and deploys do not leak connections.
  app.enableShutdownHooks();
  await app.listen(env.port);
}
await bootstrap();
