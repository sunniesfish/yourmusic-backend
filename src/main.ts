import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  const configService = app.get(ConfigService);
  const corsOrigin: string = configService.get('CORS_ORIGIN');
  const cookieDomain: string = configService.get('COOKIE_DOMAIN');
  console.log('cookieDomain', cookieDomain);
  console.log('corsOrigin', corsOrigin);
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
