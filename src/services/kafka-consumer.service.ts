import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Consumer, EachMessagePayload, Kafka } from 'kafkajs';
import { getConfig } from '../config/app.config';
import { KAFKA_TOPICS } from '../config/kafka.config';
import {
  NotificationPayload,
  NotificationService,
  TaskEventPayload,
} from './notification.service';

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private kafka: Kafka;
  private consumer: Consumer;
  private isConnected = false;
  private messageCount = 0;

  constructor(private readonly notificationService: NotificationService) {
    const config = getConfig();

    this.kafka = new Kafka({
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers,
    });

    this.consumer = this.kafka.consumer({
      groupId: config.kafka.consumerGroupId,
      allowAutoTopicCreation: true,
    });
  }

  async onModuleInit() {
    await this.connectConsumer();
    await this.subscribeToTopics();
    await this.startConsuming();
  }

  private async connectConsumer() {
    try {
      await this.consumer.connect();
      this.isConnected = true;
      this.logger.log('Kafka consumer connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect Kafka consumer', error);
      throw error;
    }
  }

  private async subscribeToTopics() {
    try {
      // Subscribe to notification topics
      await this.consumer.subscribe({
        topics: Object.values(KAFKA_TOPICS),
        fromBeginning: false,
      });
      this.logger.log('Successfully subscribed to Kafka topics');
    } catch (error) {
      this.logger.error('Failed to subscribe to Kafka topics', error);
      throw error;
    }
  }

  private async startConsuming() {
    try {
      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });
      this.logger.log('Kafka consumer is now running');
    } catch (error) {
      this.logger.error('Failed to start Kafka consumer', error);
      throw error;
    }
  }

  private async handleMessage(payload: EachMessagePayload) {
    const { topic, partition, message } = payload;
    this.messageCount++;

    try {
      const messageValue = message.value?.toString();
      const messageKey = message.key?.toString();

      this.logger.log(
        `📨 Message #${this.messageCount} from topic: ${topic}, partition: ${partition}, key: ${messageKey}`,
      );

      if (!messageValue) {
        this.logger.warn('Received empty message');
        return;
      }

      const parsedMessage = JSON.parse(messageValue);

      // Route message based on topic
      switch (topic) {
        case KAFKA_TOPICS.TASK_EVENTS:
          await this.handleTaskEvent(parsedMessage);
          break;
        case KAFKA_TOPICS.USER_NOTIFICATIONS:
          await this.handleUserNotification(parsedMessage);
          break;
        case KAFKA_TOPICS.EMAIL_NOTIFICATIONS:
          await this.handleEmailNotification(parsedMessage);
          break;
        case KAFKA_TOPICS.SMS_NOTIFICATIONS:
          await this.handleSmsNotification(parsedMessage);
          break;
        default:
          this.logger.warn(`Unknown topic: ${topic}`);
      }
    } catch (error) {
      this.logger.error(
        `❌ Error processing message #${this.messageCount} from topic ${topic}:`,
        error,
      );
    }
  }

  private async handleTaskEvent(message: any) {
    this.logger.log('🎯 Processing task event:', message);
    try {
      await this.notificationService.processTaskEvent(
        message as TaskEventPayload,
      );

      // Enhanced logging for task events
      this.logger.log(`✨ Task Event Processed Successfully`);
      this.logger.log(`📋 Event Type: ${message.event_type}`);
      this.logger.log(`🏷️ Task Code: ${message.task_code}`);
      this.logger.log(`📝 Task Name: ${message.task_name}`);
      if (message.project_name) {
        this.logger.log(`🏢 Project: ${message.project_name}`);
      }
      this.logger.log(`⏰ Timestamp: ${message.timestamp}`);
      this.logger.log(`📊 Total Messages Processed: ${this.messageCount}`);
      this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } catch (error) {
      this.logger.error('❌ Error processing task event:', error);
    }
  }

  private async handleUserNotification(message: any) {
    this.logger.log('Processing user notification:', message);
    try {
      await this.notificationService.processNotification(
        message as NotificationPayload,
      );
    } catch (error) {
      this.logger.error('Error processing user notification:', error);
    }
  }

  private async handleEmailNotification(message: any) {
    this.logger.log('Processing email notification:', message);
    try {
      const emailPayload: NotificationPayload = {
        ...message,
        type: 'email',
      };
      await this.notificationService.processNotification(emailPayload);
    } catch (error) {
      this.logger.error('Error processing email notification:', error);
    }
  }

  private async handleSmsNotification(message: any) {
    this.logger.log('Processing SMS notification:', message);
    try {
      const smsPayload: NotificationPayload = {
        ...message,
        type: 'sms',
      };
      await this.notificationService.processNotification(smsPayload);
    } catch (error) {
      this.logger.error('Error processing SMS notification:', error);
    }
  }

  async onModuleDestroy() {
    try {
      this.isConnected = false;
      await this.consumer.disconnect();
      this.logger.log('🔌 Kafka consumer disconnected successfully');
      this.logger.log(
        `📈 Total messages processed during session: ${this.messageCount}`,
      );
    } catch (error) {
      this.logger.error('❌ Error disconnecting Kafka consumer', error);
    }
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      messagesProcessed: this.messageCount,
      topics: Object.values(KAFKA_TOPICS),
    };
  }
}
