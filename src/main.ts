import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getConfig } from './config/app.config';

async function bootstrap() {
  const config = getConfig();
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);

  // Enable CORS for development
  app.enableCors();

  await app.listen(config.port);

  logger.log(`Application is running on: http://localhost:${config.port}`);
  logger.log(`Environment: ${config.nodeEnv}`);
  logger.log(`Kafka brokers: ${config.kafka.brokers.join(', ')}`);
}
bootstrap();
