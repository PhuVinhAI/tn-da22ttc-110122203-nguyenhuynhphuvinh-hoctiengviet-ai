import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { types as pgTypes } from 'pg';
import { AppModule } from './app.module';
import { LoggingService } from './infrastructure/logging/logging.service';
import { LoggingInterceptor } from './infrastructure/logging/logging.interceptor';

// CockroachDB defaults INT columns to BIGINT (INT8). pg driver returns BIGINT as
// string to preserve 64-bit precision, but our domain values (orderIndex, counts,
// progress) all fit in JS Number safely — and mobile models parse as num.
// OID 20 = INT8/BIGINT. Safe because all our int columns are within 2^53.
pgTypes.setTypeParser(20, (v) => parseInt(v, 10));

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  // Image discovery sends base64 images; default Express limit is 100kb.
  app.useBodyParser('json', { limit: Infinity });
  app.useBodyParser('urlencoded', { extended: true, limit: Infinity });

  const configService = app.get(ConfigService);
  const loggingService = app.get(LoggingService);

  // Use custom logger
  app.useLogger(loggingService);

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor(loggingService));

  // Global serializer interceptor - BẢO MẬT: Đảm bảo @Exclude() hoạt động (ví dụ: password hash)
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Global prefix
  const apiPrefix = configService.get<string>('app.apiPrefix');
  const apiVersion = configService.get<string>('app.apiVersion');
  app.setGlobalPrefix(`${apiPrefix}/${apiVersion}`);

  // CORS
  app.enableCors();

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('LinVNix API')
    .setDescription('API cho ứng dụng học tiếng Việt')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('app.port') || 3000;
  // Bind 0.0.0.0 so LAN devices (phone/tablet on same Wi-Fi) can reach the API.
  // Default NestJS listen only binds ::1/127.0.0.1 which blocks external traffic.
  await app.listen(port, '0.0.0.0');

  loggingService.log(
    `🚀 Application is running on: http://0.0.0.0:${port}`,
    'Bootstrap',
  );
  loggingService.log(
    `📚 Swagger docs: http://localhost:${port}/api/docs`,
    'Bootstrap',
  );
}
void bootstrap();
