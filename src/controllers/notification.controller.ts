import { Body, Controller, Get, Logger, Param, Post } from '@nestjs/common';
import { KafkaConsumerService } from '../services/kafka-consumer.service';
import {
  NotificationPayload,
  NotificationService,
} from '../services/notification.service';

@Controller('notifications')
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly kafkaConsumerService: KafkaConsumerService,
  ) {}

  @Get(':userId/history')
  async getNotificationHistory(@Param('userId') userId: string) {
    try {
      const history =
        await this.notificationService.getNotificationHistory(userId);
      return {
        success: true,
        data: history,
      };
    } catch (error) {
      this.logger.error('Error fetching notification history:', error);
      return {
        success: false,
        error: 'Failed to fetch notification history',
      };
    }
  }

  @Post(':notificationId/read')
  async markAsRead(@Param('notificationId') notificationId: string) {
    try {
      await this.notificationService.markNotificationAsRead(notificationId);
      return {
        success: true,
        message: 'Notification marked as read',
      };
    } catch (error) {
      this.logger.error('Error marking notification as read:', error);
      return {
        success: false,
        error: 'Failed to mark notification as read',
      };
    }
  }

  @Post('test')
  async testNotification(@Body() payload: NotificationPayload) {
    try {
      await this.notificationService.processNotification(payload);
      return {
        success: true,
        message: 'Test notification processed successfully',
      };
    } catch (error) {
      this.logger.error('Error processing test notification:', error);
      return {
        success: false,
        error: 'Failed to process test notification',
      };
    }
  }

  @Get('health')
  async health() {
    return {
      status: 'ok',
      service: 'notification-service',
      timestamp: new Date().toISOString(),
      kafka: this.kafkaConsumerService.getConnectionStatus(),
      taskEvents: this.notificationService.getTaskEventStats(),
    };
  }

  @Get('stats')
  async getStats() {
    return {
      kafkaConsumer: this.kafkaConsumerService.getConnectionStatus(),
      taskEventStats: this.notificationService.getTaskEventStats(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }
}
