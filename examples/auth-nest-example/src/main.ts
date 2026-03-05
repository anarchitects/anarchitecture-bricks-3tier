import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
  );
  app.setGlobalPrefix('api');
  const port = Number(process.env.PORT ?? 3333);
  await app.listen(port, '0.0.0.0');

  Logger.log(`Auth Nest example listening on http://localhost:${port}/api`);
}

bootstrap();
