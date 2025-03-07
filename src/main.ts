import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  const configService = app.get(ConfigService);

  const isDevelopment = configService.get('NODE_ENV') === 'development';
  const corsOrigin = isDevelopment
    ? configService.get('CORS_ORIGIN_DEV')
    : configService.get('CORS_ORIGIN_PROD');

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

  await app.listen(configService.get('PORT') ?? 4000);
}
bootstrap();
