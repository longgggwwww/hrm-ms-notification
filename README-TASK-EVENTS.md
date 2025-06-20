# Task Events Integration

This document describes the integration between the HR Task Management service (Go) and the Notification service (NestJS) via Kafka.

## Overview

The HR service publishes task-related events to the `task-events` Kafka topic, and the Notification service consumes these events to process notifications and log task activities.

## Task Event Structure

The Go service publishes events with the following structure:

```json
{
  "event_id": "20250620150405-abcd1234",
  "event_type": "task.created",
  "timestamp": "2025-06-20T10:30:00Z",
  "source": "hrm-ms-hr",
  "task_id": 123,
  "task_code": "TASK-123",
  "task_name": "Implement user authentication system",
  "description": "Detailed description of the task",
  "project_id": 456,
  "project_name": "HR Management Platform",
  "department_id": 5,
  "creator_id": 100,
  "updater_id": 100,
  "status": "pending",
  "type": "feature",
  "process": 0,
  "start_at": "2025-06-20T08:00:00Z",
  "due_date": "2025-06-27T17:00:00Z",
  "created_at": "2025-06-20T10:30:00Z",
  "updated_at": "2025-06-20T10:30:00Z",
  "assignee_ids": [101, 102],
  "label_ids": [301, 302],
  "org_id": 1,
  "zalo_gid": "3456789012345678901"
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

## Field Descriptions

| Field           | Type     | Description                                           |
| --------------- | -------- | ----------------------------------------------------- |
| `event_id`      | string   | Unique identifier for the event                       |
| `event_type`    | string   | Type of event: `task.created`, `task.updated`         |
| `timestamp`     | string   | ISO timestamp when event occurred                     |
| `source`        | string   | Source service identifier (`hrm-ms-hr`)               |
| `task_id`       | number   | Unique task identifier                                |
| `task_code`     | string   | Human-readable task code                              |
| `task_name`     | string   | Task title/name                                       |
| `description`   | string   | Task description (optional)                           |
| `project_id`    | number   | Associated project ID (optional)                      |
| `department_id` | number   | Associated department ID (optional)                   |
| `creator_id`    | number   | User ID who created the task                          |
| `updater_id`    | number   | User ID who last updated the task                     |
| `status`        | string   | Current task status                                   |
| `type`          | string   | Task type (feature, bug, etc.)                        |
| `process`       | number   | Task completion percentage (0-100)                    |
| `start_at`      | string   | Task start date (optional)                            |
| `due_date`      | string   | Task due date (optional)                              |
| `created_at`    | string   | Task creation timestamp                               |
| `updated_at`    | string   | Task last update timestamp                            |
| `assignee_ids`  | number[] | Array of assigned user IDs                            |
| `label_ids`     | number[] | Array of label IDs (optional)                         |
| `org_id`        | number   | Organization ID                                       |
| `zalo_gid`      | string   | Zalo Group ID for department notifications (optional) |

## Zalo Integration

When a task event contains a `zalo_gid` field, the notification service will:

1. Check if the Zalo Group ID is provided
2. Send formatted notifications to the specified Zalo group
3. Include task details, assignees, and deadlines in the message
4. Log the Zalo Group ID for debugging purposes

If `zalo_gid` is not provided, Zalo notifications will be skipped and a warning will be logged.
