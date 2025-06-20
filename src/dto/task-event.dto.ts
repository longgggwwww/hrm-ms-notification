export enum TaskEventType {
  TASK_CREATED = 'task.created',
  TASK_UPDATED = 'task.updated',
  TASK_ASSIGNED = 'task.assigned',
  TASK_COMPLETED = 'task.completed',
}

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
  zalo_gid?: string; // Zalo Group ID từ Department
  metadata?: Record<string, any>;
}

// Task status enum for better type safety
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DRAFT = 'draft',
  REVIEW = 'review',
  TESTING = 'testing',
  DEPLOYED = 'deployed',
}

// Task type enum for better type safety
export enum TaskType {
  FEATURE = 'feature',
  BUG = 'bug',
  IMPROVEMENT = 'improvement',
  DOCUMENTATION = 'documentation',
  TESTING = 'testing',
  MAINTENANCE = 'maintenance',
  RESEARCH = 'research',
  DESIGN = 'design',
}

// Helper functions for type checking
export function isValidTaskEventType(
  eventType: string,
): eventType is TaskEventType {
  return Object.values(TaskEventType).includes(eventType as TaskEventType);
}

export function isValidTaskStatus(status: string): status is TaskStatus {
  return Object.values(TaskStatus).includes(status as TaskStatus);
}

export function isValidTaskType(type: string): type is TaskType {
  return Object.values(TaskType).includes(type as TaskType);
}
