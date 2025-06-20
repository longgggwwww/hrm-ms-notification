import { Injectable, Logger } from '@nestjs/common';
import {
  TaskEventDto,
  TaskEventType,
  isValidTaskEventType,
} from '../dto/task-event.dto';
import { EmailService } from './email.service';
import { ZaloService } from './zalo.service';

export interface NotificationPayload {
  id: string;
  userId: string;
  type: 'email' | 'sms' | 'push';
  title: string;
  message: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface TaskEventPayload extends TaskEventDto {}

// Keep the legacy interface for backward compatibility
export interface LegacyTaskEventPayload {
  event_type: string;
  task_id: number;
  task_code: string;
  task_name: string;
  project_id?: number;
  project_name?: string;
  assignee_ids: number[];
  creator_id: number;
  org_id: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private taskEventStats = {
    total: 0,
    by_type: {
      [TaskEventType.TASK_CREATED]: 0,
      [TaskEventType.TASK_UPDATED]: 0,
      [TaskEventType.TASK_ASSIGNED]: 0,
      [TaskEventType.TASK_COMPLETED]: 0,
    },
    last_processed: null as string | null,
  };

  constructor(
    private readonly emailService: EmailService,
    private readonly zaloService: ZaloService,
  ) {}

  async processNotification(payload: NotificationPayload): Promise<void> {
    try {
      this.logger.log(`Processing notification for user ${payload.userId}`);

      switch (payload.type) {
        case 'email':
          await this.sendEmailNotification(payload);
          break;
        case 'sms':
          await this.sendSmsNotification(payload);
          break;
        case 'push':
          await this.sendPushNotification(payload);
          break;
        default:
          this.logger.warn(`Unknown notification type: ${payload.type}`);
      }
    } catch (error) {
      this.logger.error('Error processing notification:', error);
      throw error;
    }
  }

  private async sendEmailNotification(
    payload: NotificationPayload,
  ): Promise<void> {
    // TODO: Implement email sending logic
    // Example: Integration with SendGrid, AWS SES, etc.
    this.logger.log(`Email notification sent to user ${payload.userId}`);
    this.logger.debug(`Email content: ${payload.title} - ${payload.message}`);
  }

  private async sendSmsNotification(
    payload: NotificationPayload,
  ): Promise<void> {
    // TODO: Implement SMS sending logic
    // Example: Integration with Twilio, AWS SNS, etc.
    this.logger.log(`SMS notification sent to user ${payload.userId}`);
    this.logger.debug(`SMS content: ${payload.message}`);
  }

  private async sendPushNotification(
    payload: NotificationPayload,
  ): Promise<void> {
    // TODO: Implement push notification logic
    // Example: Integration with Firebase Cloud Messaging, Apple Push Notification Service, etc.
    this.logger.log(`Push notification sent to user ${payload.userId}`);
    this.logger.debug(`Push content: ${payload.title} - ${payload.message}`);
  }

  async getNotificationHistory(userId: string): Promise<NotificationPayload[]> {
    // TODO: Implement database query to get notification history
    this.logger.log(`Fetching notification history for user ${userId}`);
    return [];
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    // TODO: Implement database update to mark notification as read
    this.logger.log(`Marking notification ${notificationId} as read`);
  }

  async processTaskEvent(payload: TaskEventPayload): Promise<void> {
    try {
      // Validate event type
      if (!isValidTaskEventType(payload.event_type)) {
        this.logger.warn(`Unknown task event type: ${payload.event_type}`);
        return;
      }

      // Update statistics
      this.taskEventStats.total++;
      this.taskEventStats.by_type[payload.event_type as TaskEventType]++;
      this.taskEventStats.last_processed = new Date().toISOString();

      this.logger.log(
        `🔥 Processing task event: ${payload.event_type} for task ${payload.task_code}`,
      );
      this.logger.log(
        `📊 Stats - Total: ${this.taskEventStats.total}, ${payload.event_type}: ${this.taskEventStats.by_type[payload.event_type as TaskEventType]}`,
      );

      switch (payload.event_type) {
        case TaskEventType.TASK_CREATED:
          await this.handleTaskCreated(payload);
          break;
        case TaskEventType.TASK_UPDATED:
          await this.handleTaskUpdated(payload);
          break;
        case TaskEventType.TASK_ASSIGNED:
          await this.handleTaskAssigned(payload);
          break;
        case TaskEventType.TASK_COMPLETED:
          await this.handleTaskCompleted(payload);
          break;
        default:
          this.logger.warn(`Unknown task event type: ${payload.event_type}`);
      }
    } catch (error) {
      this.logger.error(
        `❌ Error processing task event ${payload.event_type}:`,
        error,
      );
      throw error;
    }
  }

  private async handleTaskCreated(payload: TaskEventPayload): Promise<void> {
    this.logger.log(
      `📝 Task Created: ${payload.task_code} - ${payload.task_name}`,
    );

    if (payload.project_name) {
      this.logger.log(`🏢 Project: ${payload.project_name}`);
    }

    this.logger.log(
      `📊 Status: ${payload.status}, Type: ${payload.type}, Progress: ${payload.process}%`,
    );

    if (payload.description) {
      this.logger.log(`📄 Description: ${payload.description}`);
    }

    if (payload.start_at) {
      this.logger.log(
        `🟢 Start Date: ${new Date(payload.start_at).toLocaleString('vi-VN')}`,
      );
    }

    if (payload.due_date) {
      this.logger.log(
        `🔴 Due Date: ${new Date(payload.due_date).toLocaleString('vi-VN')}`,
      );
    }

    if (payload.label_ids && payload.label_ids.length > 0) {
      this.logger.log(`🏷️ Labels: ${payload.label_ids.join(', ')}`);
    }
    if (payload.department_id) {
      this.logger.log(`🏢 Department ID: ${payload.department_id}`);
    }

    if (payload.zalo_gid) {
      this.logger.log(`💬 Zalo Group ID: ${payload.zalo_gid}`);
    }

    // Send email notification to specified email address
    try {
      this.logger.log(
        `📧 Sending email notification for task created: ${payload.task_code}`,
      );
      await this.emailService.sendTaskCreatedEmail(
        'yong9xi@gmail.com',
        payload.task_code,
        payload.task_name,
        payload.project_name,
      );
      this.logger.log(
        `✅ Email notification sent successfully to yong9xi@gmail.com`,
      );
    } catch (error) {
      this.logger.error(`❌ Failed to send email notification:`, error);
    }

    // Send Zalo group notification
    await this.sendZaloTaskNotification(payload);

    if (payload.assignee_ids && payload.assignee_ids.length > 0) {
      this.logger.log(
        `👥 Assigned to employees: ${payload.assignee_ids.join(', ')}`,
      );

      // Create notifications for assignees
      for (const assigneeId of payload.assignee_ids) {
        const notification: NotificationPayload = {
          id: `task_created_${payload.task_id}_${assigneeId}`,
          userId: assigneeId.toString(),
          type: 'push',
          title: 'New Task Assigned',
          message: `You have been assigned to task: ${payload.task_name}`,
          metadata: {
            task_id: payload.task_id,
            task_code: payload.task_code,
            project_id: payload.project_id,
            department_id: payload.department_id,
            event_type: payload.event_type,
            status: payload.status,
            type: payload.type,
            process: payload.process,
            start_at: payload.start_at,
            due_date: payload.due_date,
            creator_id: payload.creator_id,
            updater_id: payload.updater_id,
          },
          timestamp: payload.timestamp,
        };

        await this.processNotification(notification);
      }
    }
  }

  private async handleTaskUpdated(payload: TaskEventPayload): Promise<void> {
    this.logger.log(
      `✏️ Task Updated: ${payload.task_code} - ${payload.task_name}`,
    );
    this.logger.log(`🔄 Last modified by updater: ${payload.updater_id}`);
    this.logger.log(
      `📊 Status: ${payload.status}, Type: ${payload.type}, Progress: ${payload.process}%`,
    );

    if (payload.description) {
      this.logger.log(`📄 Description: ${payload.description}`);
    }

    if (payload.start_at) {
      this.logger.log(
        `🟢 Start Date: ${new Date(payload.start_at).toLocaleString('vi-VN')}`,
      );
    }

    if (payload.due_date) {
      this.logger.log(
        `🔴 Due Date: ${new Date(payload.due_date).toLocaleString('vi-VN')}`,
      );
    }

    this.logger.log(
      `📅 Updated At: ${new Date(payload.updated_at).toLocaleString('vi-VN')}`,
    );

    // Send Zalo group notification for task updates
    await this.sendZaloTaskNotification(payload);

    // Notify assignees about the update
    if (payload.assignee_ids && payload.assignee_ids.length > 0) {
      for (const assigneeId of payload.assignee_ids) {
        const notification: NotificationPayload = {
          id: `task_updated_${payload.task_id}_${assigneeId}`,
          userId: assigneeId.toString(),
          type: 'push',
          title: 'Task Updated',
          message: `Task "${payload.task_name}" has been updated`,
          metadata: {
            task_id: payload.task_id,
            task_code: payload.task_code,
            project_id: payload.project_id,
            department_id: payload.department_id,
            event_type: payload.event_type,
            status: payload.status,
            type: payload.type,
            process: payload.process,
            updater_id: payload.updater_id,
          },
          timestamp: payload.timestamp,
        };

        await this.processNotification(notification);
      }
    }
  }

  private async handleTaskAssigned(payload: TaskEventPayload): Promise<void> {
    this.logger.log(
      `👤 Task Assigned: ${payload.task_code} to employees ${payload.assignee_ids.join(', ')}`,
    );

    this.logger.log(
      `📊 Status: ${payload.status}, Type: ${payload.type}, Progress: ${payload.process}%`,
    );

    if (payload.due_date) {
      this.logger.log(
        `🔴 Due Date: ${new Date(payload.due_date).toLocaleString('vi-VN')}`,
      );
    }

    // Send notification to newly assigned users
    for (const assigneeId of payload.assignee_ids) {
      const notification: NotificationPayload = {
        id: `task_assigned_${payload.task_id}_${assigneeId}`,
        userId: assigneeId.toString(),
        type: 'email',
        title: 'Task Assignment',
        message: `You have been assigned to task: ${payload.task_name}`,
        metadata: {
          task_id: payload.task_id,
          task_code: payload.task_code,
          project_id: payload.project_id,
          department_id: payload.department_id,
          event_type: payload.event_type,
          status: payload.status,
          type: payload.type,
          process: payload.process,
          start_at: payload.start_at,
          due_date: payload.due_date,
          description: payload.description,
          creator_id: payload.creator_id,
          updater_id: payload.updater_id,
        },
        timestamp: payload.timestamp,
      };

      await this.processNotification(notification);
    }

    // Send Zalo notification for task assignment
    await this.sendZaloTaskNotification(payload);
  }

  private async handleTaskCompleted(payload: TaskEventPayload): Promise<void> {
    this.logger.log(
      `✅ Task Completed: ${payload.task_code} - ${payload.task_name}`,
    );
    this.logger.log(`🎉 Completed by: ${payload.updater_id}`);
    this.logger.log(`📊 Final Progress: ${payload.process}%`);
    this.logger.log(
      `📅 Completed At: ${new Date(payload.updated_at).toLocaleString('vi-VN')}`,
    );

    if (payload.due_date) {
      const dueDate = new Date(payload.due_date);
      const completedDate = new Date(payload.updated_at);
      const isOnTime = completedDate <= dueDate;
      this.logger.log(
        `⏰ ${isOnTime ? 'Completed on time' : 'Completed late'} (Due: ${dueDate.toLocaleString('vi-VN')})`,
      );
    }

    // Send completion notification to assignees and creator
    const notifyUserIds = [...payload.assignee_ids];
    if (!notifyUserIds.includes(payload.creator_id)) {
      notifyUserIds.push(payload.creator_id);
    }

    for (const userId of notifyUserIds) {
      const notification: NotificationPayload = {
        id: `task_completed_${payload.task_id}_${userId}`,
        userId: userId.toString(),
        type: 'push',
        title: 'Task Completed',
        message: `Task "${payload.task_name}" has been completed`,
        metadata: {
          task_id: payload.task_id,
          task_code: payload.task_code,
          project_id: payload.project_id,
          department_id: payload.department_id,
          event_type: payload.event_type,
          status: payload.status,
          type: payload.type,
          process: payload.process,
          completed_by: payload.updater_id,
          completed_at: payload.updated_at,
        },
        timestamp: payload.timestamp,
      };

      await this.processNotification(notification);
    }

    // Send Zalo notification for task completion
    await this.sendZaloTaskNotification(payload);
  }

  /**
   * Gửi thông báo task qua Zalo group
   */
  private async sendZaloTaskNotification(
    payload: TaskEventPayload,
  ): Promise<void> {
    try {
      this.logger.log(
        `📱 Sending Zalo notification for task: ${payload.task_code}`,
      );

      // Kiểm tra xem có zalo_gid không trước khi gửi
      if (!payload.zalo_gid) {
        this.logger.log(
          `⚠️ No Zalo Group ID found for task ${payload.task_code} - skipping Zalo notification`,
        );
        return;
      }

      this.logger.log(
        `💬 Using Zalo Group ID: ${payload.zalo_gid} for task ${payload.task_code}`,
      );

      // Tạo tin nhắn với format đẹp dựa trên event type
      let message = '';
      if (payload.event_type === TaskEventType.TASK_CREATED) {
        message = `🆕 **Task mới được tạo**\n\n`;
      } else if (payload.event_type === TaskEventType.TASK_UPDATED) {
        message = `✏️ **Task được cập nhật**\n\n`;
      } else {
        message = `📋 **Task Event: ${payload.event_type}**\n\n`;
      }

      message += `📋 **Mã task:** ${payload.task_code}\n`;
      message += `📝 **Tên task:** ${payload.task_name}\n`;

      if (payload.description) {
        message += `📄 **Mô tả:** ${payload.description}\n`;
      }

      if (payload.project_name) {
        message += `🏢 **Dự án:** ${payload.project_name}\n`;
      }

      message += `� **Trạng thái:** ${payload.status}\n`;
      message += `🏷️ **Loại:** ${payload.type}\n`;
      message += `📈 **Tiến độ:** ${payload.process}%\n`;

      if (payload.start_at) {
        message += `🟢 **Ngày bắt đầu:** ${new Date(payload.start_at).toLocaleDateString('vi-VN')}\n`;
      }

      if (payload.due_date) {
        message += `🔴 **Ngày hết hạn:** ${new Date(payload.due_date).toLocaleDateString('vi-VN')}\n`;
      }

      message += `�👤 **Người tạo:** User ${payload.creator_id}\n`;

      if (payload.event_type === 'task.updated') {
        message += `✏️ **Người cập nhật:** User ${payload.updater_id}\n`;
      }

      if (payload.assignee_ids && payload.assignee_ids.length > 0) {
        message += `👥 **Được giao cho:** ${payload.assignee_ids.map((id) => `User ${id}`).join(', ')}\n`;
      }

      if (payload.label_ids && payload.label_ids.length > 0) {
        message += `🏷️ **Labels:** ${payload.label_ids.join(', ')}\n`;
      }

      message += `⏰ **Thời gian:** ${new Date(payload.timestamp).toLocaleString('vi-VN')}\n`;
      message += `🔗 **Task ID:** #${payload.task_id}`;

      // Sử dụng GMF API cho group text message với zalo_gid từ payload
      await this.zaloService.sendGroupTextMessage(message, payload.zalo_gid);

      this.logger.log(
        `✅ Zalo GMF notification sent successfully for task ${payload.task_code}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to send Zalo GMF notification for task ${payload.task_code}:`,
        error,
      );
      // Không throw error để không làm gián đoạn flow chính
    }
  }

  /**
   * Gửi thông báo task rich format qua Zalo
   */
  private async sendZaloRichTaskNotification(
    payload: TaskEventPayload,
  ): Promise<void> {
    try {
      this.logger.log(
        `📱 Sending rich Zalo notification for task: ${payload.task_code}`,
      );

      const eventTypeText =
        payload.event_type === 'task.created'
          ? 'Task mới'
          : payload.event_type === 'task.updated'
            ? 'Task cập nhật'
            : 'Task event';

      const title = `${payload.event_type === 'task.created' ? '🆕' : '✏️'} ${eventTypeText}: ${payload.task_code}`;

      let subtitle = `${payload.task_name}\n`;
      if (payload.project_name) {
        subtitle += `🏢 Dự án: ${payload.project_name}\n`;
      }
      subtitle += `📊 ${payload.status} | ${payload.type} | ${payload.process}%`;

      if (payload.due_date) {
        subtitle += `\n🔴 Hạn: ${new Date(payload.due_date).toLocaleDateString('vi-VN')}`;
      }

      const elements = [
        {
          title: title,
          subtitle: subtitle,
          default_action: {
            type: 'oa.open.url',
            url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/tasks/${payload.task_id}`,
          },
        },
      ];

      await this.zaloService.sendRichGroupMessage(
        title,
        subtitle,
        elements,
        payload.zalo_gid,
      );

      this.logger.log(
        `✅ Rich Zalo notification sent successfully for task ${payload.task_code}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to send rich Zalo notification for task ${payload.task_code}:`,
        error,
      );
    }
  }

  getTaskEventStats() {
    return {
      ...this.taskEventStats,
      uptime_since: this.taskEventStats.last_processed
        ? new Date(this.taskEventStats.last_processed).toLocaleString()
        : 'Never',
    };
  }
}
