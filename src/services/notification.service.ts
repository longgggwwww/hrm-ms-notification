import { Injectable, Logger } from '@nestjs/common';
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

export interface TaskEventPayload {
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
      task_created: 0,
      task_updated: 0,
      task_assigned: 0,
      task_completed: 0,
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
      // Update statistics
      this.taskEventStats.total++;
      this.taskEventStats.by_type[
        payload.event_type as keyof typeof this.taskEventStats.by_type
      ]++;
      this.taskEventStats.last_processed = new Date().toISOString();

      this.logger.log(
        `🔥 Processing task event: ${payload.event_type} for task ${payload.task_code}`,
      );
      this.logger.log(
        `📊 Stats - Total: ${this.taskEventStats.total}, ${payload.event_type}: ${this.taskEventStats.by_type[payload.event_type as keyof typeof this.taskEventStats.by_type]}`,
      );

      switch (payload.event_type) {
        case 'task.created':
          await this.handleTaskCreated(payload);
          break;
        case 'task.updated':
          await this.handleTaskUpdated(payload);
          break;
        case 'task.assigned':
          await this.handleTaskAssigned(payload);
          break;
        case 'task.completed':
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
            event_type: payload.event_type,
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
    this.logger.log(`🔄 Last modified by creator: ${payload.creator_id}`);
  }

  private async handleTaskAssigned(payload: TaskEventPayload): Promise<void> {
    this.logger.log(
      `👤 Task Assigned: ${payload.task_code} to employees ${payload.assignee_ids.join(', ')}`,
    );

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
          event_type: payload.event_type,
        },
        timestamp: payload.timestamp,
      };

      await this.processNotification(notification);
    }
  }

  private async handleTaskCompleted(payload: TaskEventPayload): Promise<void> {
    this.logger.log(
      `✅ Task Completed: ${payload.task_code} - ${payload.task_name}`,
    );
    this.logger.log(`🎉 Completed by: ${payload.creator_id}`);
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

      // Tạo tin nhắn với format đẹp
      let message = `🆕 **Task mới được tạo**\n\n`;
      message += `📋 **Mã task:** ${payload.task_code}\n`;
      message += `📝 **Tên task:** ${payload.task_name}\n`;

      if (payload.project_name) {
        message += `🏢 **Dự án:** ${payload.project_name}\n`;
      }

      message += `👤 **Người tạo:** User ${payload.creator_id}\n`;

      if (payload.assignee_ids && payload.assignee_ids.length > 0) {
        message += `👥 **Được giao cho:** ${payload.assignee_ids.map((id) => `User ${id}`).join(', ')}\n`;
      }

      message += `⏰ **Thời gian:** ${new Date(payload.timestamp).toLocaleString('vi-VN')}\n`;
      message += `🔗 **Task ID:** #${payload.task_id}`;

      // Sử dụng GMF API cho group text message
      await this.zaloService.sendGroupTextMessage(message);

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

      const title = `🆕 Task mới: ${payload.task_code}`;
      const subtitle = `${payload.task_name}\n${payload.project_name ? `Dự án: ${payload.project_name}` : ''}`;

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

      await this.zaloService.sendRichGroupMessage(title, subtitle, elements);

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
