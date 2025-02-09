import { Injectable } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { YoutubeCredentials } from '../entities/youtube-token.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { googleAuthConfigService } from '../configs/google.auth.config';
import { OAuth2Service } from './oauth2.service';
import {
  OAuth2AuthOptions,
  OAuth2AuthResponse,
  OAuth2TokenResponse,
} from '../interfaces/auth-status.interface';
import { AuthorizationError } from '../errors/spotify-auth.errors';

@Injectable()
export class GoogleAuthService extends OAuth2Service {
  constructor(
    @InjectRepository(YoutubeCredentials)
    private readonly youtubeCredentialsRepository: Repository<YoutubeCredentials>,
  ) {
    super();
  }

  /**
   * create oauth2 client
   * @returns oauth2 client
   */
  private createOAuthClient(): OAuth2Client {
    return new OAuth2Client(
      googleAuthConfigService.getConfig().clientId,
      googleAuthConfigService.getConfig().clientSecret,
      googleAuthConfigService.getConfig().redirectUri,
    );
  }

  async getOAuthClient(
    userId: string | null,
    accessToken: string,
    refreshToken: string | null,
  ): Promise<OAuth2Client> {
    const oauth2Client = this.createOAuthClient();
    if (!userId) {
      oauth2Client.setCredentials({
        access_token: accessToken,
      });
      return oauth2Client;
    }

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    return oauth2Client;
  }
  /**
   * create auth url
   * @returns auth url
   */
  getAuthUrl(options?: OAuth2AuthOptions): string {
    const oauth2Client = this.createOAuthClient();
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/youtube'],
      prompt: 'consent',
      redirect_uri: googleAuthConfigService.getConfig().redirectUri,
      client_id: googleAuthConfigService.getConfig().clientId,
      state: options?.state,
    });
  }

  /**
   * get access token and refresh token
   * @param authResponse - auth response
   * @param userId - user id
   * @returns OAuth2TokenResponse
   */
  async getToken(
    authResponse: OAuth2AuthResponse,
    userId: string | null,
  ): Promise<OAuth2TokenResponse> {
    const oauth2Client = this.createOAuthClient();
    const { tokens } = await oauth2Client.getToken(authResponse.code);

    if (userId) {
      await this.youtubeCredentialsRepository.save({
        userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date,
      });
    }

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expiry_date,
      token_type: 'Bearer',
    };
  }

  /**
   * refresh access token
   * @param userId - user id
   * @returns OAuth2TokenResponse
   */
  async refreshAccessToken(userId: string): Promise<OAuth2TokenResponse> {
    const oauth2Client = this.createOAuthClient();
    const credentials = await this.youtubeCredentialsRepository.findOne({
      where: { userId },
    });

    if (!credentials.refreshToken) {
      throw new AuthorizationError('Refresh token not found');
    }

    oauth2Client.setCredentials({
      refresh_token: credentials.refreshToken,
    });
    const { credentials: newCredentials } =
      await oauth2Client.refreshAccessToken();

    await this.youtubeCredentialsRepository.update(userId, {
      refreshToken: newCredentials.refresh_token,
      expiryDate: newCredentials.expiry_date,
    });
    return {
      access_token: newCredentials.access_token,
      token_type: newCredentials.token_type,
      expires_in: newCredentials.expiry_date,
      refresh_token: newCredentials.refresh_token,
    };
  }

  /**
   * sign out
   * @param userId - user id
   */
  async signOut(userId: string): Promise<void> {
    await this.youtubeCredentialsRepository.delete({ userId });
  }
}
