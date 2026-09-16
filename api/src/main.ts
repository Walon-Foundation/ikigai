import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { env } from './env.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // The client, the admin panel and the marketing site are all separate
  // origins from this API, so without this the browser refuses every request
  // before it is sent. credentials:true is required for the Better Auth
  // session cookie to travel — a wildcard origin would silently disable it,
  // which is why the list is explicit.
  //
  // The Expo app is unaffected: native requests are not subject to CORS, and
  // it authenticates with a bearer token rather than a cookie.
  app.enableCors({
    origin: [env.appUrl, env.adminUrl, env.marketingUrl],
    credentials: true,
  });
  // Lets DatabaseModule.onModuleDestroy close the pool on SIGTERM, so dev
  // restarts and deploys do not leak connections.
  app.enableShutdownHooks();
  await app.listen(env.port);
}
await bootstrap();
