import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './controllers/auth.controller';
import { NotificationController } from './controllers/notification.controller';
import { ZaloWebhookController } from './controllers/zalo-webhook.controller';
import { EmailService } from './services/email.service';
import { KafkaConsumerService } from './services/kafka-consumer.service';
import { NotificationService } from './services/notification.service';
import { ZaloWebhookService } from './services/zalo-webhook.service';
import { ZaloService } from './services/zalo.service';

@Module({
  imports: [],
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
  ],
})
export class AppModule {}
