import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';

export interface CachedTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  created_at: number; // timestamp when token was created
}

@Injectable()
export class TokenCacheService {
  private readonly logger = new Logger(TokenCacheService.name);
  private readonly ZALO_TOKEN_KEY = 'zalo_tokens';

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Lưu tokens vào cache
   */
  async setTokens(tokens: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }): Promise<void> {
    const cachedTokens: CachedTokens = {
      ...tokens,
      created_at: Date.now(),
    };

    // TTL được set bằng expires_in (seconds) trừ đi 5 phút để đảm bảo refresh trước khi hết hạn
    const ttl = Math.max(300, tokens.expires_in - 300); // minimum 5 minutes, otherwise expires_in - 5 minutes

    await this.cacheManager.set(this.ZALO_TOKEN_KEY, cachedTokens, ttl * 1000); // convert to milliseconds

    this.logger.log(`Tokens cached with TTL: ${ttl} seconds`);
  }

  /**
   * Lấy tokens từ cache
   */
  async getTokens(): Promise<CachedTokens | null> {
    const tokens = await this.cacheManager.get<CachedTokens>(
      this.ZALO_TOKEN_KEY,
    );

    if (!tokens) {
      this.logger.debug('No tokens found in cache');
      return null;
    }

    // Kiểm tra xem token có còn hợp lệ không
    const currentTime = Date.now();
    const tokenAge = (currentTime - tokens.created_at) / 1000; // convert to seconds

    if (tokenAge >= tokens.expires_in) {
      this.logger.warn('Tokens in cache have expired');
      await this.clearTokens();
      return null;
    }

    this.logger.debug('Retrieved valid tokens from cache');
    return tokens;
  }

  /**
   * Kiểm tra xem token có sắp hết hạn không (trong vòng 5 phút)
   */
  async isTokenExpiringSoon(): Promise<boolean> {
    const tokens = await this.getTokens();

    if (!tokens) {
      return true; // No tokens means we need to get new ones
    }

    const currentTime = Date.now();
    const tokenAge = (currentTime - tokens.created_at) / 1000;
    const timeToExpiry = tokens.expires_in - tokenAge;

    // Return true if token expires in less than 5 minutes (300 seconds)
    return timeToExpiry <= 300;
  }

  /**
   * Xóa tokens khỏi cache
   */
  async clearTokens(): Promise<void> {
    await this.cacheManager.del(this.ZALO_TOKEN_KEY);
    this.logger.log('Tokens cleared from cache');
  }

  /**
   * Lấy thời gian còn lại của token (seconds)
   */
  async getTokenTimeToLive(): Promise<number | null> {
    const tokens = await this.getTokens();

    if (!tokens) {
      return null;
    }

    const currentTime = Date.now();
    const tokenAge = (currentTime - tokens.created_at) / 1000;
    const timeToExpiry = tokens.expires_in - tokenAge;

    return Math.max(0, timeToExpiry);
  }

  /**
   * Lấy thông tin trạng thái cache
   */
  async getCacheStatus(): Promise<{
    hasTokens: boolean;
    timeToLive?: number;
    isExpiringSoon?: boolean;
    createdAt?: Date;
  }> {
    const tokens = await this.getTokens();

    if (!tokens) {
      return { hasTokens: false };
    }

    const ttl = await this.getTokenTimeToLive();
    const expiringSoon = await this.isTokenExpiringSoon();

    return {
      hasTokens: true,
      timeToLive: ttl,
      isExpiringSoon: expiringSoon,
      createdAt: new Date(tokens.created_at),
    };
  }
}
