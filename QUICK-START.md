# 🚀 Task Events Integration - Quick Start Guide

## Overview

This integration connects your Go HR service with the NestJS Notification service via Kafka, enabling real-time task event processing and notifications.

## 🎯 Features

- ✅ Real-time task event processing from Go HR service
- 📝 Rich console logging with emoji indicators
- 📊 Event statistics and monitoring
- 🔔 Automatic notifications for task assignments
- 🏥 Health check endpoints
- 🧪 Comprehensive testing tools
- 📈 Performance monitoring

## 🚀 Quick Start

### 1. Start Everything

```bash
npm run setup:tasks
```

This single command will:

- Start Kafka and Zookeeper
- Build and start the notification service
- Run integration tests
- Show system status

### 2. Monitor System

```bash
npm run monitor:tasks
```

Interactive monitoring dashboard with options to:

- Check service health
- View statistics
- Monitor real-time logs
- Send test events

### 3. Send Test Events

```bash
npm run kafka:test-tasks
```

Sends sample task events to test the integration.

## 📋 Event Types Supported

| Event Type       | Description            | Notifications                   |
| ---------------- | ---------------------- | ------------------------------- |
| `task_created`   | New task created       | Push notifications to assignees |
| `task_updated`   | Task modified          | Log updates                     |
| `task_assigned`  | Task assigned to users | Email notifications             |
| `task_completed` | Task marked complete   | Celebration logs                |

## 🔍 Monitoring Endpoints

- **Health Check**: `GET /notifications/health`
- **Statistics**: `GET /notifications/stats`

Example health response:

```json
{
  "status": "healthy",
  "timestamp": "2025-06-12T10:30:00Z",
  "kafka": {
    "connected": true,
    "messagesProcessed": 45,
    "topics": ["task-events", "user.notifications"]
  },
  "taskEvents": {
    "total": 12,
    "by_type": {
      "task_created": 5,
      "task_assigned": 4,
      "task_completed": 3
    }
  }
}
```

## 📝 Log Output Examples

### Task Created Event

```
[KafkaConsumerService] 📨 Message #1 from topic: task-events, partition: 0, key: 123
[KafkaConsumerService] 🎯 Processing task event: { event_type: 'task_created', ... }
[NotificationService] 🔥 Processing task event: task_created for task #123
[NotificationService] 📊 Stats - Total: 1, task_created: 1
[NotificationService] 📝 Task Created: #123 - Implement user authentication
[NotificationService] 🏢 Project: HR Management Platform
[NotificationService] 👥 Assigned to employees: 101, 102
[KafkaConsumerService] ✨ Task Event Processed Successfully
[KafkaConsumerService] 📋 Event Type: task_created
[KafkaConsumerService] 🏷️ Task Code: #123
[KafkaConsumerService] 📝 Task Name: Implement user authentication
[KafkaConsumerService] 🏢 Project: HR Management Platform
[KafkaConsumerService] ⏰ Timestamp: 2025-06-12T10:30:00Z
[KafkaConsumerService] 📊 Total Messages Processed: 1
[KafkaConsumerService] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 🔧 Configuration

### Kafka Brokers

Update in `src/config/kafka.config.ts`:

```typescript
brokers: ['kafka:29092'], // Change as needed
```

### Consumer Group

```typescript
groupId: 'notification-consumer-group',
```

## 📊 Available Scripts

| Script                     | Description              |
| -------------------------- | ------------------------ |
| `npm run setup:tasks`      | Complete setup and start |
| `npm run monitor:tasks`    | Interactive monitoring   |
| `npm run kafka:test-tasks` | Send test events         |
| `npm run start:dev`        | Start service only       |
| `npm run docker:kafka`     | Start Kafka only         |

## 🐳 Docker Services

The integration uses these Docker services:

- **Zookeeper**: Kafka coordination
- **Kafka**: Message broker
- **Notification Service**: Event processor

## 🔍 Troubleshooting

### Service Not Starting

```bash
# Check Docker
docker ps

# Check logs
docker logs hrm-ms-platform-kafka-1
tail -f logs/service.log
```

### Kafka Connection Issues

```bash
# Verify Kafka is accessible
docker exec hrm-ms-platform-kafka-1 kafka-topics --bootstrap-server localhost:9092 --list
```

### No Events Received

1. Verify Go service is publishing to `task-events` topic
2. Check consumer group is not lagging
3. Verify topic exists and has messages

## 🔗 Integration with Go Service

Your Go service should publish to the `task-events` topic with this structure:

```go
event := kafka.TaskCreatedEvent{
    EventType:    "task_created",
    TaskID:       123,
    TaskCode:     "#123",
    TaskName:     "Implement feature",
    ProjectID:    456,
    ProjectName:  "HR Platform",
    AssigneeIDs:  []int{101, 102},
    CreatorID:    100,
    OrgID:        1,
    Timestamp:    time.Now().Format(time.RFC3339),
    Metadata:     map[string]interface{}{"priority": "high"},
}

err := kafkaClient.PublishEvent(ctx, "task-events", strconv.Itoa(task.ID), event)
```

## 📞 Support

For issues or questions:

1. Check the monitoring dashboard: `npm run monitor:tasks`
2. Review service logs: `tail -f logs/service.log`
3. Verify health endpoints: `curl http://localhost:3000/notifications/health`

---

🎉 **You're all set!** The task events integration is now running and ready to process events from your Go HR service.
