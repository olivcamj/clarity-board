import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);

    app.getHttpAdapter().getInstance().disable('x-powered-by'); // Remove the header

    app.enableCors({
      origin: 'http://localhost:3000',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // strips unknown prperties
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
