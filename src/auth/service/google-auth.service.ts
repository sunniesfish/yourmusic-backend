import { Injectable } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { YoutubeCredentials } from '../entities/youtube-token.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { googleAuthConfigService } from '../configs/google.auth.config';
import { AuthStatus } from '../interfaces/auth-status.interface';
import { TokenRefreshError } from '../errors/auth.errors';

@Injectable()
export class GoogleAuthService {
  constructor(
    @InjectRepository(YoutubeCredentials)
    private readonly youtubeCredentialsRepository: Repository<YoutubeCredentials>,
  ) {}

  private createOAuthClient(): OAuth2Client {
    return new OAuth2Client(
      googleAuthConfigService.getConfig().clientId,
      googleAuthConfigService.getConfig().clientSecret,
      googleAuthConfigService.getConfig().redirectUri,
    );
  }

  async getOAuthClientForUser(userId: string): Promise<OAuth2Client> {
    const oauth2Client = this.createOAuthClient();
    const credentials = await this.getUserTokens(userId);
    if (credentials) {
      if (credentials.expiryDate < Date.now() && credentials.refreshToken) {
        try {
          oauth2Client.setCredentials({
            refresh_token: credentials.refreshToken,
          });
          const { credentials: newCredentials } =
            await oauth2Client.refreshAccessToken();
          await this.youtubeCredentialsRepository.update(
            { userId },
            {
              accessToken: newCredentials.access_token,
              expiryDate: newCredentials.expiry_date,
            },
          );
          oauth2Client.setCredentials(newCredentials);
        } catch (error) {
          throw new TokenRefreshError(error.message);
        }
      } else {
        oauth2Client.setCredentials(credentials);
      }
    }
    return oauth2Client;
  }

  private async getUserTokens(
    userId: string,
  ): Promise<YoutubeCredentials | null> {
    const youtubeCredentials = await this.youtubeCredentialsRepository.findOne({
      where: { userId },
    });
    return youtubeCredentials ? youtubeCredentials : null;
  }

  getAuthUrl(): string {
    const oauth2Client = this.createOAuthClient();
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/youtube'],
      prompt: 'consent',
    });
  }

  async getToken(code: string, userId: string) {
    const oauth2Client = this.createOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    await this.youtubeCredentialsRepository.save({
      userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
    });

    return tokens;
  }

  async checkAuthStatus(userId: string): Promise<AuthStatus> {
    try {
      const credentials = await this.getUserTokens(userId);

      if (!credentials) {
        return {
          isAuthenticated: false,
          needsReauth: true,
          message: '인증이 필요합니다',
        };
      }

      const isExpired = credentials.expiryDate < Date.now();

      if (isExpired && !credentials.refreshToken) {
        return {
          isAuthenticated: false,
          needsReauth: true,
          message: '재인증이 필요합니다',
        };
      }

      if (isExpired) {
        try {
          const oauth2Client = this.createOAuthClient();
          oauth2Client.setCredentials({
            refresh_token: credentials.refreshToken,
          });
          await oauth2Client.refreshAccessToken();
          return {
            isAuthenticated: true,
            needsReauth: false,
          };
        } catch (error) {
          return {
            isAuthenticated: false,
            needsReauth: true,
            message: error.message,
          };
        }
      }

      return {
        isAuthenticated: true,
        needsReauth: false,
      };
    } catch (error) {
      return {
        isAuthenticated: false,
        needsReauth: true,
        message: error.message,
      };
    }
  }
}
