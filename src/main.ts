import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import helmet from 'helmet';
import * as express from 'express';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers — add before any other middleware
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      // cross-origin needed so MinIO/R2 file URLs work in browser
      // without this, browser blocks loading files from different origin
    }),
  );

  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ limit: '5mb', extended: true }));

  // Global validation — rejects requests with invalid/missing fields
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,              // strips fields not in your DTO
      forbidNonWhitelisted: true,   // throws error if unknown fields sent
      transform: true,              // auto-converts types (string "3" → number 3)
    }),
  );

  // Global error handler — consistent error response format
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global rsponse handler — consistent response format
  app.useGlobalInterceptors(new ResponseInterceptor());

  // CORS — allow frontend to call this API
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        'http://localhost:3001',   // Next.js dev server
        'http://localhost:3000',
        'http://localhost:80',
        'http://localhost',
        process.env.FRONTEND_URL,  // production frontend
      ].filter(Boolean);           // remove undefined values

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

   // ─── Swagger ────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('DevBoard API')
    .setDescription(
      `
      Task & team collaboration platform API.

      ## Authentication
      Most endpoints require a Bearer JWT token.
      1. Register via \`POST /auth/register\`
      2. Login via \`POST /auth/login\` to get your access token
      3. Click **Authorize** above and paste the token
      `,
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your access token',
      },
      'access-token', // this name is referenced in @ApiBearerAuth() decorator
    )
    .addTag('health', 'App and database health checks')
    .addTag('auth', 'Register, login, token refresh')
    .addTag('users', 'User profile management')
    .addTag('organizations', 'Organization CRUD and member management')
    .addTag('projects', 'Project management within organizations')
    .addTag('tasks', 'Task CRUD, assignment, and status updates')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,  // JWT stays saved when you refresh the page
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'DevBoard API Docs',
  });
  // ────────────────────────────────────────────────────────────

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`\n🚀 App running at http://localhost:${port}`);
  console.log(`📖 Swagger docs at http://localhost:${port}/api/docs\n`);
}

bootstrap();