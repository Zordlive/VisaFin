import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for React frontend - allow all localhost ports for development
  app.enableCors({
    origin: function(origin, callback) {
      // Allow requests with no origin (like mobile apps, curl requests)
      if (!origin) return callback(null, true);
      
      // Allow localhost on any port for development
      if (origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      
      // Allow production domain
      if (origin === 'https://visafin-gest.org' || origin === 'https://www.visafin-gest.org') {
        return callback(null, true);
      }
      
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`✅ Application is running on: http://localhost:${port}`);
}

bootstrap();
