import { Injectable } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { YoutubeCredentials } from 'src/auth/entities/youtube-token.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { OAuth2Service } from 'src/auth/core/services/oauth2.service';

import {
  OAuth2AuthResponse,
  OAuth2TokenResponse,
  OAuth2AuthOptions,
} from '../../common/interfaces/oauth.interface';
import { OAuthorizationError } from '../../common/errors/oauth.errors';
import { ConfigService } from '@nestjs/config';
import { createGoogleAuthConfig } from './google.auth.config';
import { GOOGLE_OAUTH_SCOPES } from '../../common/constants/oauth-scope.constant';

@Injectable()
export class GoogleAuthService extends OAuth2Service {
  private readonly config = createGoogleAuthConfig(this.configService);
  constructor(
    @InjectRepository(YoutubeCredentials)
    private readonly youtubeCredentialsRepository: Repository<YoutubeCredentials>,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  /**
   * create oauth2 client
   * @returns oauth2 client
   */
  private createOAuthClient(): OAuth2Client {
    return new OAuth2Client(
      this.config.clientId,
      this.config.clientSecret,
      this.config.redirectUri,
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
      scope: GOOGLE_OAUTH_SCOPES.YOUTUBE,
      prompt: 'consent',
      redirect_uri: this.config.redirectUri,
      client_id: this.config.clientId,
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
    console.log('in getToken', tokens);

    if (userId && tokens.refresh_token) {
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
    console.log('start refreshAccessToken');
    const oauth2Client = this.createOAuthClient();
    try {
      const credentials = await this.youtubeCredentialsRepository.findOne({
        where: { userId },
      });
      console.log('credentials', credentials);
      if (!credentials) {
        console.log('credentials not found. throw oauthorization error');
        throw new OAuthorizationError('Refresh token not found');
      }

      oauth2Client.setCredentials({
        refresh_token: credentials.refreshToken,
      });
      const { credentials: newCredentials } =
        await oauth2Client.refreshAccessToken();
      console.log('newCredentials', newCredentials);

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
    } catch (error) {
      throw new OAuthorizationError('Failed to refresh access token');
    }
  }

  /**
   * sign out
   * @param userId - user id
   */
  async signOut(userId: string): Promise<void> {
    await this.youtubeCredentialsRepository.delete({ userId });
  }
}
