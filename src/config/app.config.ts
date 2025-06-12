export interface AppConfig {
  port: number;
  nodeEnv: string;
  kafka: {
    brokers: string[];
    clientId: string;
    consumerGroupId: string;
  };
  logging: {
    level: string;
  };
  email: {
    user: string;
    password: string;
    from: string;
  };
}

export const getConfig = (): AppConfig => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'kafka:29092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'notification-service',
    consumerGroupId:
      process.env.KAFKA_CONSUMER_GROUP_ID || 'notification-consumer-group',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  email: {
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'HR Management System <noreply@hrm.com>',
  },
});
