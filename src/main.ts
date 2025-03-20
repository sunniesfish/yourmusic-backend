import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  const configService = app.get(ConfigService);
  const corsOrigin = configService.get('CORS_ORIGIN');

  const DB_HOST = configService.get('DB_HOST');
  console.log('****DB_HOST', DB_HOST);
  if (!DB_HOST) {
    throw new Error(`DB_HOST is not set: ${DB_HOST}`);
  }

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Authorization',
      'Content-Type',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
  });

  if (configService.get('NODE_ENV') === 'development') {
    await app.listen(configService.get('PORT'));
  } else {
    await app.listen(configService.get('PORT'), '0.0.0.0');
  }
}
bootstrap();
