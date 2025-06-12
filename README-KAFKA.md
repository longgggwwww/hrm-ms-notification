# Notification Service - Kafka Consumer

A NestJS-based notification service that consumes messages from Kafka and processes various types of notifications (email, SMS, push notifications).

## Features

- **Kafka Consumer**: Connects to Kafka broker at `kafka:29092`
- **Multiple Notification Types**: Supports email, SMS, and push notifications
- **Topic-based Routing**: Processes messages from different Kafka topics
- **Health Check Endpoint**: Monitor service status
- **Configurable**: Environment-based configuration
- **Dockerized**: Ready for containerized deployment

## Architecture

```
Kafka Topics → Kafka Consumer → Notification Service → External Services
```

### Kafka Topics

- `user.notifications` - General user notifications
- `email.notifications` - Email-specific notifications
- `sms.notifications` - SMS-specific notifications

## Quick Start

### Prerequisites

- Node.js 20+
- Docker and Docker Compose (for Kafka)
- npm or pnpm

### Installation

1. Install dependencies:

```bash
npm install
```

2. Copy environment configuration:

```bash
cp .env.example .env
```

3. Start Kafka using Docker Compose:

```bash
docker-compose up -d zookeeper kafka
```

4. Start the notification service:

```bash
npm run start:dev
```

### Using Docker Compose (Recommended)

Start everything (Kafka + Notification Service):

```bash
docker-compose up
```

## Configuration

Environment variables (see `.env.example`):

- `PORT`: Application port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `KAFKA_BROKERS`: Kafka broker addresses (default: kafka:29092)
- `KAFKA_CLIENT_ID`: Kafka client identifier
- `KAFKA_CONSUMER_GROUP_ID`: Consumer group ID
- `LOG_LEVEL`: Logging level (debug/info/warn/error)

## API Endpoints

### Health Check

```http
GET /notifications/health
```

### Get Notification History

```http
GET /notifications/:userId/history
```

### Mark Notification as Read

```http
POST /notifications/:notificationId/read
```

### Test Notification (Development)

```http
POST /notifications/test
Content-Type: application/json

{
  "id": "test-123",
  "userId": "user-456",
  "type": "email",
  "title": "Test Notification",
  "message": "This is a test notification",
  "timestamp": "2025-06-12T10:30:00Z"
}
```

## Message Format

Expected Kafka message format:

```json
{
  "id": "notification-id",
  "userId": "user-id",
  "type": "email|sms|push",
  "title": "Notification Title",
  "message": "Notification message content",
  "metadata": {
    "key": "value"
  },
  "timestamp": "2025-06-12T10:30:00Z"
}
```

## Development

### Running Tests

```bash
npm run test
npm run test:e2e
```

### Linting

```bash
npm run lint
```

### Building

```bash
npm run build
```

## Deployment

### Docker

```bash
docker build -t notification-service .
docker run -p 3000:3000 -e KAFKA_BROKERS=your-kafka-broker:29092 notification-service
```

### Production Environment Variables

Make sure to set appropriate values for:

- `NODE_ENV=production`
- `KAFKA_BROKERS=your-production-kafka-brokers`
- `LOG_LEVEL=warn`

## Monitoring

- Service logs include Kafka connection status and message processing
- Health check endpoint at `/notifications/health`
- Monitor consumer lag and processing metrics

## Troubleshooting

### Kafka Connection Issues

1. Verify Kafka broker is running and accessible
2. Check `KAFKA_BROKERS` environment variable
3. Ensure network connectivity between service and Kafka

### Message Processing Failures

1. Check application logs for error details
2. Verify message format matches expected schema
3. Monitor Kafka consumer group lag

## Next Steps

- [ ] Add database integration for notification history
- [ ] Implement email service integration (SendGrid, AWS SES)
- [ ] Implement SMS service integration (Twilio, AWS SNS)
- [ ] Add push notification service (Firebase FCM)
- [ ] Add metrics and monitoring (Prometheus)
- [ ] Add message retry mechanism
- [ ] Add dead letter queue handling
