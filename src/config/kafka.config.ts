import { KafkaOptions, Transport } from '@nestjs/microservices';

export const kafkaConfig: KafkaOptions = {
  transport: Transport.KAFKA,
  options: {
    client: {
      clientId: 'notification-service',
      brokers: ['kafka:29092'],
    },
    consumer: {
      groupId: 'notification-consumer-group',
      allowAutoTopicCreation: true,
    },
  },
};

export const KAFKA_TOPICS = {
  TASK_EVENTS: 'task-events',
  USER_NOTIFICATIONS: 'user.notifications',
  EMAIL_NOTIFICATIONS: 'email.notifications',
  SMS_NOTIFICATIONS: 'sms.notifications',
} as const;
