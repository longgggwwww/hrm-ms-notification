import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { getConfig } from '../config/app.config';

interface ZaloTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

interface ZaloUserInfo {
  oa_id: string;
  name: string;
  description: string;
  avatar: string;
  cover: string;
  num_follower: number;
}

@Injectable()
export class ZaloService implements OnModuleInit {
  private readonly logger = new Logger(ZaloService.name);
  private readonly config = getConfig();
  private readonly httpClient: AxiosInstance;
  private tokens: ZaloTokens | null = null;

  constructor() {
    this.httpClient = axios.create({
      baseURL: this.config.zalo.apiUrl,
      timeout: 10000,
    });
  }

  onModuleInit() {
    this.logger.log('Zalo service initialized');
  }

  /**
   * Tạo URL để redirect user đến Zalo để xác thực
   */
  getAuthUrl(): string {
    const params = new URLSearchParams({
      app_id: this.config.zalo.appId,
      redirect_uri: this.config.zalo.callbackUrl,
      state: this.generateState(),
    });

    return `https://oauth.zaloapp.com/v4/oa/permission?${params.toString()}`;
  }

  /**
   * Xử lý callback từ Zalo sau khi user xác thực
   */
  async handleCallback(code: string, state: string): Promise<ZaloTokens> {
    try {
      this.logger.log(`Processing Zalo callback with code: ${code}`);

      const response = await this.httpClient.post(
        '/v4/oa/access_token',
        {
          app_id: this.config.zalo.appId,
          code: code,
          grant_type: 'authorization_code',
        },
        {
          headers: {
            secret_key: this.config.zalo.appSecret,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      console.log('Zalo callback response:', response.data);

      if (response.data.error) {
        throw new Error(
          `Zalo API error: ${response.data.error} - ${response.data.message}`,
        );
      }

      this.tokens = response.data;
      this.logger.log('Successfully obtained Zalo tokens');

      return this.tokens;
    } catch (error) {
      this.logger.error('Error handling Zalo callback:', error);
      throw error;
    }
  }

  /**
   * Refresh access token sử dụng refresh token
   */
  async refreshToken(): Promise<ZaloTokens> {
    if (!this.tokens?.refresh_token) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await this.httpClient.post(
        '/v4/oa/access_token',
        {
          app_id: this.config.zalo.appId,
          app_secret: this.config.zalo.appSecret,
          refresh_token: this.tokens.refresh_token,
          grant_type: 'refresh_token',
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      if (response.data.error) {
        throw new Error(
          `Zalo API error: ${response.data.error} - ${response.data.message}`,
        );
      }

      this.tokens = response.data.data;
      this.logger.log('Successfully refreshed Zalo tokens');

      return this.tokens;
    } catch (error) {
      this.logger.error('Error refreshing Zalo token:', error);
      throw error;
    }
  }

  /**
   * Kiểm tra xem error có phải là lỗi token không
   */
  private isTokenError(error: any): boolean {
    const tokenErrorCodes = [
      216, // Token không hợp lệ
      217, // Token hết hạn
      218, // Token bị revoke
      219, // Quyền truy cập bị từ chối
      220, // App chưa được phê duyệt
    ];

    const errorCode = error?.response?.data?.error || error?.error;
    return tokenErrorCodes.includes(Number(errorCode));
  }

  /**
   * Thực hiện API call với auto retry nếu gặp lỗi token
   */
  private async makeApiCallWithRetry<T>(
    apiCall: () => Promise<T>,
    retryCount = 0,
    maxRetries = 1,
  ): Promise<T> {
    try {
      return await apiCall();
    } catch (error) {
      this.logger.error('API call failed:', error);

      // Nếu là lỗi token và chưa retry quá số lần cho phép
      if (this.isTokenError(error) && retryCount < maxRetries) {
        this.logger.log('Token error detected, attempting to refresh token...');

        try {
          await this.refreshToken();
          this.logger.log('Token refreshed successfully, retrying API call...');
          return await this.makeApiCallWithRetry(
            apiCall,
            retryCount + 1,
            maxRetries,
          );
        } catch (refreshError) {
          this.logger.error('Failed to refresh token:', refreshError);
          throw new Error('Authentication failed. Please re-authenticate.');
        }
      }

      throw error;
    }
  }

  /**
   * Gửi tin nhắn đến group với auto retry (Customer Support)
   */
  async sendGroupMessage(message: string): Promise<void> {
    if (!this.tokens?.access_token) {
      throw new Error('No access token available. Please authenticate first.');
    }

    const apiCall = async () => {
      const response = await this.httpClient.post(
        '/v3.0/oa/message/cs',
        {
          recipient: {
            user_id: this.config.zalo.groupId,
          },
          message: {
            text: message,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.tokens.access_token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data.error) {
        const error = new Error(
          `Zalo API error: ${response.data.error} - ${response.data.message}`,
        );
        (error as any).error = response.data.error;
        throw error;
      }

      this.logger.log('Successfully sent message to Zalo group');
      return response.data;
    };

    await this.makeApiCallWithRetry(apiCall);
  }

  /**
   * Gửi tin nhắn text đến group sử dụng GMF (Group Message Feature)
   * Theo document: https://developers.zalo.me/docs/official-account/nhom-chat-gmf/tin-nhan/text_message
   */
  async sendGroupTextMessage(message: string): Promise<void> {
    console.log('Sending group text message:', message);
    console.log('groupId:', this.config.zalo.groupId);
    console.log('api url:', this.httpClient.defaults.baseURL);
    if (!this.tokens?.access_token) {
      throw new Error('No access token available. Please authenticate first.');
    }

    const apiCall = async () => {
      const response = await axios.post(
        'https://openapi.zalo.me/v3.0/oa/group/message',
        {
          recipient: {
            group_id: this.config.zalo.groupId,
          },
          message: {
            text: message,
          },
        },
        {
          headers: {
            access_token: this.tokens.access_token,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data.error) {
        const error = new Error(
          `Zalo GMF API error: ${response.data.error} - ${response.data.message}`,
        );
        (error as any).error = response.data.error;
        throw error;
      }

      this.logger.log('Successfully sent text message to Zalo group via GMF');
      return response.data;
    };

    await this.makeApiCallWithRetry(apiCall);
  }

  /**
   * Gửi tin nhắn có định dạng rich (template)
   */
  async sendRichGroupMessage(
    title: string,
    subtitle: string,
    elements?: any[],
  ): Promise<void> {
    if (!this.tokens?.access_token) {
      throw new Error('No access token available. Please authenticate first.');
    }

    const apiCall = async () => {
      const attachment = {
        type: 'template',
        payload: {
          template_type: 'list',
          elements: elements || [
            {
              title: title,
              subtitle: subtitle,
              default_action: {
                type: 'oa.open.url',
                url: this.config.zalo.callbackUrl,
              },
            },
          ],
        },
      };

      const response = await this.httpClient.post(
        '/v3.0/oa/message/cs',
        {
          recipient: {
            user_id: this.config.zalo.groupId,
          },
          message: {
            attachment: attachment,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.tokens.access_token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data.error) {
        const error = new Error(
          `Zalo API error: ${response.data.error} - ${response.data.message}`,
        );
        (error as any).error = response.data.error;
        throw error;
      }

      this.logger.log('Successfully sent rich message to Zalo group');
      return response.data;
    };

    await this.makeApiCallWithRetry(apiCall);
  }

  /**
   * Lấy thông tin Official Account profile
   */
  async getUserInfo(): Promise<ZaloUserInfo> {
    if (!this.tokens?.access_token) {
      throw new Error('No access token available. Please authenticate first.');
    }

    const apiCall = async () => {
      try {
        const response = await this.httpClient.get('/v2.0/oa/getoa', {
          headers: {
            Authorization: `Bearer ${this.tokens.access_token}`,
          },
        });

        if (response.data.error) {
          const error = new Error(
            `Zalo API error: ${response.data.error} - ${response.data.message}`,
          );
          (error as any).error = response.data.error;
          throw error;
        }

        return response.data.data;
      } catch (error) {
        // Nếu không lấy được thông tin OA, trả về thông tin cơ bản
        this.logger.warn(
          'Could not fetch OA info, returning basic info:',
          error.message,
        );
        return {
          oa_id: 'unknown',
          name: 'Zalo Official Account',
          description: 'Successfully authenticated with Zalo OA',
          avatar: '',
          cover: '',
          num_follower: 0,
        };
      }
    };

    return await this.makeApiCallWithRetry(apiCall);
  }

  /**
   * Refresh token thủ công - có thể gọi từ endpoint
   */
  async manualRefreshToken(): Promise<ZaloTokens> {
    return await this.refreshToken();
  }

  /**
   * Tạo state string ngẫu nhiên để bảo mật
   */
  private generateState(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  /**
   * Lấy trạng thái hiện tại của tokens
   */
  getTokenStatus(): {
    hasTokens: boolean;
    accessToken?: string;
    expiresIn?: number;
  } {
    return {
      hasTokens: !!this.tokens,
      accessToken: this.tokens?.access_token
        ? `${this.tokens.access_token.substring(0, 10)}...`
        : undefined,
      expiresIn: this.tokens?.expires_in,
    };
  }
}
