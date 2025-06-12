import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NotificationController } from './controllers/notification.controller';
import { EmailService } from './services/email.service';
import { KafkaConsumerService } from './services/kafka-consumer.service';
import { NotificationService } from './services/notification.service';

@Module({
  imports: [],
  controllers: [AppController, NotificationController],
  providers: [
    AppService,
    KafkaConsumerService,
    NotificationService,
    EmailService,
  ],
})
export class AppModule {}
