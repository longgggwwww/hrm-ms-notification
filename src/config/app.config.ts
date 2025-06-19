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
  zalo: {
    appId: string;
    appSecret: string;
    callbackUrl: string;
    groupId: string;
    apiUrl: string;
    webhookVerifyToken: string;
    webhookVerifySignature: boolean;
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
  zalo: {
    appId: process.env.ZALO_APP_ID || '',
    appSecret: process.env.ZALO_APP_SECRET || '',
    callbackUrl:
      process.env.ZALO_CALLBACK_URL ||
      'http://localhost:3000/auth/zalo/callback',
    groupId: process.env.ZALO_GROUP_ID || '',
    apiUrl: process.env.ZALO_API_URL || 'https://openapi.zalo.me',
    webhookVerifyToken: process.env.ZALO_VERIFY_TOKEN || 'your-verify-token',
    webhookVerifySignature:
      process.env.ZALO_WEBHOOK_VERIFY_SIGNATURE === 'true',
  },
});
