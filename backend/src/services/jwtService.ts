import jwt from 'jsonwebtoken';
import { config } from '@/config';
import { JWTPayload, User } from '@/types';
import logger from '@/utils/logger';

class JWTService {
  private readonly secret: string;
  private readonly expiresIn: string;
  private readonly refreshExpiresIn: string;

  constructor() {
    this.secret = config.jwt.secret;
    this.expiresIn = config.jwt.expiresIn;
    this.refreshExpiresIn = config.jwt.refreshExpiresIn;
  }

  /**
   * Generate access token
   */
  public generateAccessToken(user: User): string {
    try {
      const payload: JWTPayload = {
        userId: user.id,
        telegramId: user.telegram_id || undefined,
        role: user.role || undefined,
      };

      return jwt.sign(payload as any, this.secret, {
        expiresIn: this.expiresIn as any,
        issuer: 'medusa-vape-shop',
        audience: 'medusa-vape-shop-client',
      } as any);
    } catch (error) {
      logger.error('Error generating access token:', error);
      throw new Error('Failed to generate access token');
    }
  }

  /**
   * Generate refresh token
   */
  public generateRefreshToken(user: User): string {
    try {
      const payload: JWTPayload = {
        userId: user.id,
        telegramId: user.telegram_id || undefined,
        role: user.role || undefined,
      };

      return jwt.sign(payload as any, this.secret, {
        expiresIn: this.refreshExpiresIn as any,
        issuer: 'medusa-vape-shop',
        audience: 'medusa-vape-shop-client',
      } as any);
    } catch (error) {
      logger.error('Error generating refresh token:', error);
      throw new Error('Failed to generate refresh token');
    }
  }

  /**
   * Generate both access and refresh tokens
   */
  public generateTokens(user: User): { accessToken: string; refreshToken: string } {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
    };
  }

  /**
   * Verify and decode token
   */
  public verifyToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: 'medusa-vape-shop',
        audience: 'medusa-vape-shop-client',
      }) as JWTPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      } else if (error instanceof jwt.NotBeforeError) {
        throw new Error('Token not active yet');
      } else {
        logger.error('Error verifying token:', error);
        throw new Error('Token verification failed');
      }
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  public decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch (error) {
      logger.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  public isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) return true;

      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  /**
   * Get token expiration time
   */
  public getTokenExpiration(token: string): Date | null {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) return null;

      return new Date(decoded.exp * 1000);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get time until token expires (in seconds)
   */
  public getTimeUntilExpiration(token: string): number | null {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) return null;

      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExp = decoded.exp - currentTime;
      
      return timeUntilExp > 0 ? timeUntilExp : 0;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract token from Authorization header
   */
  public extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) return null;

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1] || null;
  }

  /**
   * Validate token format
   */
  public isValidTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') return false;

    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // Each part should be base64url encoded
    try {
      parts.forEach(part => {
        if (!part) throw new Error('Empty part');
        // Try to decode base64url
        Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export default new JWTService();
