import { Controller, Get, Logger, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ZaloService } from '../services/zalo.service';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly zaloService: ZaloService) {}

  /**
   * Endpoint để kiểm tra trạng thái cache và tokens
   */
  @Get('zalo/status')
  async getZaloTokenStatus() {
    try {
      const status = await this.zaloService.getTokenStatus();
      return {
        success: true,
        data: status,
      };
    } catch (error) {
      this.logger.error('Error getting token status:', error);
      return {
        success: false,
        message: 'Failed to get token status',
        error: error.message,
      };
    }
  }

  /**
   * Endpoint để refresh token thủ công
   */
  @Post('zalo/refresh')
  async refreshZaloToken() {
    try {
      const tokens = await this.zaloService.manualRefreshToken();
      return {
        success: true,
        message: 'Tokens refreshed successfully',
        data: {
          expires_in: tokens.expires_in,
          access_token: `${tokens.access_token.substring(0, 10)}...`,
        },
      };
    } catch (error) {
      this.logger.error('Error refreshing token:', error);
      return {
        success: false,
        message: 'Failed to refresh token',
        error: error.message,
      };
    }
  }

  /**
   * Endpoint để clear cache và tokens
   */
  @Post('zalo/clear')
  async clearZaloTokens() {
    try {
      await this.zaloService.clearTokens();
      return {
        success: true,
        message: 'Tokens cleared successfully',
      };
    } catch (error) {
      this.logger.error('Error clearing tokens:', error);
      return {
        success: false,
        message: 'Failed to clear tokens',
        error: error.message,
      };
    }
  }

  /**
   * Endpoint để redirect user đến Zalo để xác thực
   */
  @Get('zalo')
  async initiateZaloAuth(@Res() res: Response): Promise<void> {
    try {
      const authUrl = this.zaloService.getAuthUrl();
      this.logger.log(`Redirecting to Zalo auth URL: ${authUrl}`);
      res.redirect(authUrl);
    } catch (error) {
      this.logger.error('Error initiating Zalo auth:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initiate Zalo authentication',
        error: error.message,
      });
    }
  }

  /**
   * Callback endpoint để nhận authorization code từ Zalo
   */
  @Get('zalo/callback')
  async handleZaloCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      if (error) {
        this.logger.error(`Zalo auth error: ${error}`);
        res.status(400).json({
          success: false,
          message: 'Zalo authentication failed',
          error: error,
        });
        return;
      }

      if (!code) {
        this.logger.error('No authorization code received from Zalo');
        res.status(400).json({
          success: false,
          message: 'No authorization code received',
        });
        return;
      }

      this.logger.log(`Received authorization code from Zalo: ${code}`);

      const tokens = await this.zaloService.handleCallback(code, state);

      console.log('Zalo tokens received:', tokens);

      this.logger.log('Successfully obtained access_token and refresh_token');

      res.json({
        success: true,
        message: 'Zalo authentication successful - tokens obtained',
        data: {
          access_token_preview: `${tokens.access_token.substring(0, 10)}...`,
          refresh_token_preview: `${tokens.refresh_token.substring(0, 10)}...`,
          expires_in: tokens.expires_in,
        },
      });
    } catch (error) {
      this.logger.error('Error handling Zalo callback:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process Zalo callback',
        error: error.message,
      });
    }
  }

  /**
   * Endpoint để test gửi tin nhắn (CS API)
   */
  @Get('zalo/test-message')
  async testZaloMessage(@Query('message') message?: string): Promise<any> {
    try {
      const testMessage =
        message || 'Test message from HRM Notification Service';

      await this.zaloService.sendGroupMessage(testMessage);

      return {
        success: true,
        message: 'Test message sent successfully via CS API',
        data: {
          sentMessage: testMessage,
        },
      };
    } catch (error) {
      this.logger.error('Error sending test message:', error);
      return {
        success: false,
        message: 'Failed to send test message',
        error: error.message,
      };
    }
  }

  /**
   * Endpoint để test gửi tin nhắn GMF (Group Message Feature)
   */
  @Get('zalo/test-gmf-message')
  async testZaloGmfMessage(@Query('message') message?: string): Promise<any> {
    try {
      const testMessage =
        message || 'Test GMF message from HRM Notification Service 🚀';

      await this.zaloService.sendGroupTextMessage(testMessage);

      return {
        success: true,
        message: 'Test GMF message sent successfully',
        data: {
          sentMessage: testMessage,
          api: 'GMF (Group Message Feature)',
        },
      };
    } catch (error) {
      this.logger.error('Error sending test GMF message:', error);
      return {
        success: false,
        message: 'Failed to send test GMF message',
        error: error.message,
      };
    }
  }
}
