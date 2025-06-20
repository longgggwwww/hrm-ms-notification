# Task Event Fields Enhancement

## Mô tả

Đã bổ sung các field mới cho task event trong notification service để đồng bộ hoàn toàn với TaskEvent struct từ HR service (Go).

## Các thay đổi chính

### 1. TaskEventDto Interface mới

Đã tạo `src/dto/task-event.dto.ts` với interface hoàn chỉnh bao gồm tất cả các field từ Go event:

```typescript
export interface TaskEventDto {
  event_id: string;
  event_type: TaskEventType;
  timestamp: string;
  source: string;
  task_id: number;
  task_code: string;
  task_name: string;
  description?: string;
  project_id?: number;
  project_name?: string;
  department_id?: number;
  creator_id: number;
  updater_id: number;
  status: string;
  type: string;
  process: number;
  start_at?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
  assignee_ids: number[];
  label_ids?: number[];
  org_id: number;
  metadata?: Record<string, any>;
}
```

### 2. Task Event Type Enum

Thêm enum cho type safety:

```typescript
export enum TaskEventType {
  TASK_CREATED = 'task.created',
  TASK_UPDATED = 'task.updated',
  TASK_ASSIGNED = 'task.assigned',
  TASK_COMPLETED = 'task.completed',
}
```

### 3. Task Status và Type Enums

Thêm enums cho các trạng thái và loại task:

```typescript
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  // ... more statuses
}

export enum TaskType {
  FEATURE = 'feature',
  BUG = 'bug',
  IMPROVEMENT = 'improvement',
  // ... more types
}
```

### 4. Enhanced Notification Service

#### Cập nhật TaskEventPayload

- Extends từ TaskEventDto để có đầy đủ fields
- Thêm validation với `isValidTaskEventType()`

#### Enhanced Task Event Handlers

- **handleTaskCreated**: Hiển thị thêm status, type, progress, description, dates, labels
- **handleTaskUpdated**: Theo dõi updater_id, hiển thị chi tiết thay đổi
- **handleTaskAssigned**: Bao gồm thông tin task đầy đủ trong metadata
- **handleTaskCompleted**: Theo dõi completion details, check on-time completion

#### Enhanced Zalo Notifications

- Hiển thị thông tin chi tiết hơn: status, type, progress, dates
- Hỗ trợ cả task created và updated events
- Rich format notifications với thông tin đầy đủ

### 5. Enhanced Kafka Consumer Logging

Kafka consumer giờ đây log thông tin chi tiết hơn:

- Task status, type, progress
- Department ID, label IDs
- Due dates và timestamps
- Event IDs và organization info

## Các field mới được hỗ trợ

1. **event_id**: Unique identifier cho event
2. **source**: Nguồn gốc event (hrm-ms-hr)
3. **description**: Mô tả chi tiết task
4. **department_id**: ID phòng ban
5. **updater_id**: ID người cập nhật cuối cùng
6. **status**: Trạng thái hiện tại của task
7. **type**: Loại task
8. **process**: Phần trăm tiến độ (0-100)
9. **start_at**: Ngày bắt đầu
10. **due_date**: Ngày hết hạn
11. **created_at**: Thời gian tạo
12. **updated_at**: Thời gian cập nhật cuối
13. **label_ids**: Danh sách ID labels
14. **org_id**: ID tổ chức

## Backward Compatibility

- Giữ nguyên interface `LegacyTaskEventPayload` để tương thích với code cũ
- Tất cả existing functionality vẫn hoạt động bình thường
- Chỉ thêm tính năng mới, không breaking changes

## Type Safety Improvements

- Sử dụng enums thay vì string literals
- Helper functions để validate event types
- Strict typing cho tất cả task event fields

## Testing

Để test các thay đổi:

1. **Start notification service:**

   ```bash
   npm run start:dev
   ```

2. **Test task events:**

   ```bash
   npm run kafka:test-tasks
   ```

3. **Monitor task events:**
   ```bash
   npm run monitor:tasks
   ```

## Next Steps

1. **Database Integration**: Lưu trữ task events vào database
2. **User Preferences**: Cho phép users config loại notification muốn nhận
3. **Webhooks**: Hỗ trợ webhook notifications cho external systems
4. **Analytics**: Tracking và analytics cho task events
5. **Performance**: Optimize performance cho high-volume events
