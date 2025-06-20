import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './controllers/auth.controller';
import { NotificationController } from './controllers/notification.controller';
import { ZaloWebhookController } from './controllers/zalo-webhook.controller';
import { EmailService } from './services/email.service';
import { KafkaConsumerService } from './services/kafka-consumer.service';
import { NotificationService } from './services/notification.service';
import { TokenCacheService } from './services/token-cache.service';
import { ZaloWebhookService } from './services/zalo-webhook.service';
import { ZaloService } from './services/zalo.service';

@Module({
  imports: [
    CacheModule.register({
      ttl: 3600, // 1 hour default TTL (in seconds)
      max: 100, // maximum number of items in cache
      isGlobal: true, // make cache module global
    }),
  ],
  controllers: [
    AppController,
    NotificationController,
    AuthController,
    ZaloWebhookController,
  ],
  providers: [
    AppService,
    KafkaConsumerService,
    NotificationService,
    EmailService,
    ZaloService,
    ZaloWebhookService,
    TokenCacheService,
  ],
})
export class AppModule {}
