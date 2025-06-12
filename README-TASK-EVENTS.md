# Task Events Integration

This document describes the integration between the HR Task Management service (Go) and the Notification service (NestJS) via Kafka.

## Overview

The HR service publishes task-related events to the `task-events` Kafka topic, and the Notification service consumes these events to process notifications and log task activities.

## Task Event Structure

The Go service publishes events with the following structure:

```json
{
  "event_type": "task_created",
  "task_id": 123,
  "task_code": "#123",
  "task_name": "Implement user authentication system",
  "project_id": 456,
  "project_name": "HR Management Platform",
  "assignee_ids": [101, 102],
  "creator_id": 100,
  "org_id": 1,
  "timestamp": "2025-06-12T10:30:00Z",
  "metadata": {
    "priority": "high",
    "type": "feature"
  }
}
```

## Supported Event Types

1. **task_created** - When a new task is created
2. **task_updated** - When an existing task is modified
3. **task_assigned** - When a task is assigned to users
4. **task_completed** - When a task is marked as completed

## Event Processing

The notification service processes each event type with specific logging and notification behaviors:

### Task Created (`task_created`)

- Logs task creation with emoji indicators 📝
- Shows project information if available 🏢
- Lists assigned employees 👥
- Sends push notifications to assignees

### Task Updated (`task_updated`)

- Logs task updates ✏️
- Shows who made the modification 🔄

### Task Assigned (`task_assigned`)

- Logs task assignment 👤
- Sends email notifications to newly assigned users

### Task Completed (`task_completed`)

- Logs task completion ✅
- Celebrates completion 🎉

## Enhanced Logging

The service provides rich console logging with:

- Emoji indicators for easy visual scanning
- Structured log messages with task details
- Separator lines for clear event boundaries
- Color-coded success/error messages

Example log output:

```
[KafkaConsumerService] Processing task event: { event_type: 'task_created', task_id: 123, ... }
[NotificationService] 📝 Task Created: #123 - Implement user authentication system
[NotificationService] 🏢 Project: HR Management Platform
[NotificationService] 👥 Assigned to employees: 101, 102
[KafkaConsumerService] ✨ Task Event Processed Successfully
[KafkaConsumerService] 📋 Event Type: task_created
[KafkaConsumerService] 🏷️ Task Code: #123
[KafkaConsumerService] 📝 Task Name: Implement user authentication system
[KafkaConsumerService] 🏢 Project: HR Management Platform
[KafkaConsumerService] ⏰ Timestamp: 2025-06-12T10:30:00Z
[KafkaConsumerService] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Testing

### 1. Start the Services

```bash
# Start Kafka and Zookeeper
npm run docker:kafka

# Start the notification service
npm run start:dev
```

### 2. Send Test Events

```bash
# Send test task events
npm run kafka:test-tasks
```

### 3. Monitor Logs

Watch the notification service console for processed events and notifications.

## Integration with Go Service

The Go HR service should publish events to the `task-events` topic using the structure shown above. Here's an example of what the Go service publishes:

```go
event := kafka.NewTaskCreatedEvent(task, orgID)
key := strconv.Itoa(task.ID)
s.KafkaClient.PublishEvent(ctx, "task-events", key, event)
```

## Configuration

Update the Kafka broker configuration in `src/config/kafka.config.ts` to match your environment:

```typescript
export const kafkaConfig: KafkaOptions = {
  transport: Transport.KAFKA,
  options: {
    client: {
      clientId: 'notification-service',
      brokers: ['kafka:29092'], // Update as needed
    },
    consumer: {
      groupId: 'notification-consumer-group',
      allowAutoTopicCreation: true,
    },
  },
};
```

## Topics

- `task-events` - Main topic for task-related events from HR service
- `user.notifications` - User notification events
- `email.notifications` - Email notification events
- `sms.notifications` - SMS notification events
