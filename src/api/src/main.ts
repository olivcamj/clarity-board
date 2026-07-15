import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    app.useWebSocketAdapter(new IoAdapter(app));

    app.getHttpAdapter().getInstance().disable('x-powered-by'); // Remove the header

    app.enableCors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // strips unknown properties
        forbidNonWhitelisted: true,
        transform: true, // transforms payloads into DTO instances
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    console.log('Running');

    await app.listen(process.env.PORT ?? 3001);
  } catch (e) {
    console.error(e);
  }
}
bootstrap();
