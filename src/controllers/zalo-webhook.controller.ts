import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
} from '@nestjs/common';
import { getConfig } from '../config/app.config';
import { ZaloWebhookEventDto } from '../dto/zalo-webhook.dto';
import { ZaloWebhookService } from '../services/zalo-webhook.service';

@Controller('webhook/zalo')
export class ZaloWebhookController {
  private readonly logger = new Logger(ZaloWebhookController.name);
  private readonly config = getConfig();

  constructor(private readonly zaloWebhookService: ZaloWebhookService) {}

  /**
   * Endpoint GET để Zalo OA verify webhook URL
   * GET /webhook/zalo
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async verifyWebhookUrl(@Query() query: any): Promise<string> {
    this.logger.log('Zalo OA webhook verification request:', query);

    // Trả về challenge nếu có, hoặc trả về 200 OK
    if (query.challenge) {
      return query.challenge;
    }

    return 'OK';
  }

  /**
   * Endpoint POST để nhận webhook events từ Zalo OA
   * POST /webhook/zalo
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhookEvent(
    @Body() payload: any,
    @Headers() headers: any,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      this.logger.log('Received Zalo OA webhook event:', {
        payload,
        headers: {
          'x-zalo-signature': headers['x-zalo-signature'],
          'content-type': headers['content-type'],
        },
      });

      // Xử lý webhook event
      await this.zaloWebhookService.handleWebhookEvent(payload);

      this.logger.log('Webhook event processed successfully');
      return {
        success: true,
        message: 'Webhook processed successfully',
      };
    } catch (error) {
      this.logger.error('Error processing webhook:', error);

      // Trả về 200 để Zalo không retry
      return {
        success: false,
        message: 'Error processing webhook',
      };
    }
  }

  /**
   * Endpoint để test webhook manually
   * POST /webhook/zalo/test
   */
  @Post('test')
  async testWebhook(
    @Body() payload: any,
  ): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log('Test webhook called');

      // Tạo mock payload để test
      const mockPayload: ZaloWebhookEventDto = {
        app_id: this.config.zalo.appId,
        timestamp: new Date().toISOString(),
        data: [
          {
            app_id: this.config.zalo.appId,
            user_id_by_app: 'test-user-123',
            oa_id: 'test-oa-id',
            timestamp: new Date().toISOString(),
            event_name: 'user_send_text',
            message: {
              text: payload.text || 'Test message from webhook',
              msg_id: 'test-msg-' + Date.now(),
            },
            sender: {
              id: 'test-sender-123',
            },
            recipient: {
              id: this.config.zalo.appId,
            },
            group_info: {
              group_id: this.config.zalo.groupId || 'test-group-123',
              group_name: 'Test Group',
              group_type: 'GMF',
            },
          },
        ],
      };

      await this.zaloWebhookService.handleWebhookEvent(mockPayload);

      return {
        success: true,
        message: 'Test webhook processed successfully',
      };
    } catch (error) {
      this.logger.error('Error processing test webhook:', error);
      return {
        success: false,
        message: 'Error processing test webhook',
      };
    }
  }

  /**
   * Health check endpoint
   * GET /webhook/zalo/health
   */
  @Get('health')
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
