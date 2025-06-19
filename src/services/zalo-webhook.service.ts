import { Injectable, Logger } from '@nestjs/common';
import { getConfig } from '../config/app.config';
import {
  ZaloWebhookEventDto,
  ZaloWebhookMessageDto,
} from '../dto/zalo-webhook.dto';

@Injectable()
export class ZaloWebhookService {
  private readonly logger = new Logger(ZaloWebhookService.name);
  private readonly config = getConfig();

  /**
   * Xử lý webhook event từ Zalo GMF
   */
  async handleWebhookEvent(event: ZaloWebhookEventDto): Promise<void> {
    try {
      this.logger.log(
        `Received Zalo webhook event with ${event.data.length} messages`,
      );

      for (const message of event.data) {
        await this.processMessage(message);
      }
    } catch (error) {
      this.logger.error('Error processing Zalo webhook event:', error);
      throw error;
    }
  }

  /**
   * Xử lý từng message trong webhook
   */
  private async processMessage(message: ZaloWebhookMessageDto): Promise<void> {
    try {
      this.logger.log(
        `Processing message: ${message.message.msg_id} from user: ${message.sender.id}`,
      );

      // Kiểm tra xem có phải message từ group không
      if (message.group_info) {
        await this.handleGroupMessage(message);
      } else {
        await this.handleDirectMessage(message);
      }
    } catch (error) {
      this.logger.error(
        `Error processing message ${message.message.msg_id}:`,
        error,
      );
    }
  }

  /**
   * Xử lý tin nhắn từ group GMF
   */
  private async handleGroupMessage(
    message: ZaloWebhookMessageDto,
  ): Promise<void> {
    const { group_info, sender, message: msg } = message;

    this.logger.log(`Group message received:`, {
      groupId: group_info.group_id,
      groupName: group_info.group_name,
      groupType: group_info.group_type,
      senderId: sender.id,
      messageId: msg.msg_id,
      text: msg.text,
      attachments: msg.attachments?.length || 0,
    });

    // Xử lý các loại message khác nhau
    if (msg.text) {
      await this.handleTextMessage(message);
    }

    if (msg.attachments && msg.attachments.length > 0) {
      await this.handleAttachments(message);
    }

    // Có thể thêm logic tự động phản hồi hoặc chuyển tiếp tin nhắn ở đây
    await this.autoReplyIfNeeded(message);
  }

  /**
   * Xử lý tin nhắn trực tiếp (không phải từ group)
   */
  private async handleDirectMessage(
    message: ZaloWebhookMessageDto,
  ): Promise<void> {
    this.logger.log(`Direct message received from user: ${message.sender.id}`);
    // Xử lý tin nhắn trực tiếp nếu cần
  }

  /**
   * Xử lý tin nhắn text
   */
  private async handleTextMessage(
    message: ZaloWebhookMessageDto,
  ): Promise<void> {
    const text = message.message.text;
    this.logger.log(`Text message: "${text}"`);

    // Có thể thêm logic phân tích tin nhắn, tìm keywords, v.v.
    if (text) {
      const keywords = this.extractKeywords(text);
      if (keywords.length > 0) {
        this.logger.log(`Extracted keywords: ${keywords.join(', ')}`);
      }
    }
  }

  /**
   * Xử lý attachments (hình ảnh, file, location, v.v.)
   */
  private async handleAttachments(
    message: ZaloWebhookMessageDto,
  ): Promise<void> {
    const attachments = message.message.attachments;

    for (const attachment of attachments) {
      this.logger.log(`Processing attachment:`, {
        type: attachment.type,
        url: attachment.payload.url,
        title: attachment.payload.title,
        description: attachment.payload.description,
      });

      switch (attachment.type) {
        case 'image':
          await this.handleImageAttachment(attachment);
          break;
        case 'location':
          await this.handleLocationAttachment(attachment);
          break;
        case 'file':
          await this.handleFileAttachment(attachment);
          break;
        default:
          this.logger.log(`Unknown attachment type: ${attachment.type}`);
      }
    }
  }

  /**
   * Xử lý hình ảnh
   */
  private async handleImageAttachment(attachment: any): Promise<void> {
    this.logger.log(`Image attachment received: ${attachment.payload.url}`);
    // Có thể lưu trữ, phân tích hình ảnh, v.v.
  }

  /**
   * Xử lý location
   */
  private async handleLocationAttachment(attachment: any): Promise<void> {
    const { latitude, longitude } = attachment.payload.coordinates || {};
    this.logger.log(`Location attachment: lat=${latitude}, lng=${longitude}`);
  }

  /**
   * Xử lý file
   */
  private async handleFileAttachment(attachment: any): Promise<void> {
    this.logger.log(`File attachment: ${attachment.payload.url}`);
  }

  /**
   * Tự động phản hồi nếu cần
   */
  private async autoReplyIfNeeded(
    message: ZaloWebhookMessageDto,
  ): Promise<void> {
    const text = message.message.text?.toLowerCase();

    // Ví dụ: tự động phản hồi cho một số keywords
    if (text?.includes('help') || text?.includes('hỗ trợ')) {
      this.logger.log('Auto-reply triggered for help request');
      // Có thể gọi API để gửi tin nhắn phản hồi
    }
  }

  /**
   * Trích xuất keywords từ tin nhắn
   */
  private extractKeywords(text: string): string[] {
    const keywords = [
      'urgent',
      'khẩn cấp',
      'help',
      'hỗ trợ',
      'task',
      'công việc',
    ];
    return keywords.filter((keyword) =>
      text.toLowerCase().includes(keyword.toLowerCase()),
    );
  }

  /**
   * Verify webhook signature (nếu cần)
   */
  verifyWebhookSignature(signature: string, payload: string): boolean {
    // Implement signature verification logic here
    // Sử dụng app_secret để verify signature
    return true; // Placeholder
  }
}
