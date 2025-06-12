#!/usr/bin/env node

const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'test-producer',
  brokers: ['localhost:9092'], // Use localhost for testing from host machine
});

const producer = kafka.producer();

const TOPICS = {
  USER_NOTIFICATIONS: 'user.notifications',
  EMAIL_NOTIFICATIONS: 'email.notifications',
  SMS_NOTIFICATIONS: 'sms.notifications',
};

async function sendTestMessages() {
  try {
    await producer.connect();
    console.log('Connected to Kafka');

    // Test user notification
    await producer.send({
      topic: TOPICS.USER_NOTIFICATIONS,
      messages: [
        {
          key: 'user-123',
          value: JSON.stringify({
            id: 'notif-001',
            userId: 'user-123',
            type: 'push',
            title: 'Welcome!',
            message: 'Welcome to our platform!',
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    });
    console.log('✓ Sent user notification');

    // Test email notification
    await producer.send({
      topic: TOPICS.EMAIL_NOTIFICATIONS,
      messages: [
        {
          key: 'user-456',
          value: JSON.stringify({
            id: 'email-001',
            userId: 'user-456',
            type: 'email',
            title: 'Password Reset',
            message: 'Click here to reset your password',
            metadata: {
              email: 'user@example.com',
              template: 'password-reset',
            },
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    });
    console.log('✓ Sent email notification');

    // Test SMS notification
    await producer.send({
      topic: TOPICS.SMS_NOTIFICATIONS,
      messages: [
        {
          key: 'user-789',
          value: JSON.stringify({
            id: 'sms-001',
            userId: 'user-789',
            type: 'sms',
            title: 'Verification Code',
            message: 'Your verification code is: 123456',
            metadata: {
              phone: '+1234567890',
            },
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    });
    console.log('✓ Sent SMS notification');

    console.log('\nAll test messages sent successfully!');
  } catch (error) {
    console.error('Error sending messages:', error);
  } finally {
    await producer.disconnect();
    console.log('Disconnected from Kafka');
  }
}

if (require.main === module) {
  sendTestMessages().catch(console.error);
}

module.exports = { sendTestMessages };
