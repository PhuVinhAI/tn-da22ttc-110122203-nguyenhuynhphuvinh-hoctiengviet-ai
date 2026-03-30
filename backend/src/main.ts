import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { LoggingService } from './infrastructure/logging/logging.service';
import { LoggingInterceptor } from './infrastructure/logging/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  
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
  await app.listen(port);
  
  loggingService.log(`🚀 Application is running on: http://localhost:${port}`, 'Bootstrap');
  loggingService.log(`📚 Swagger docs: http://localhost:${port}/api/docs`, 'Bootstrap');
}
bootstrap();
