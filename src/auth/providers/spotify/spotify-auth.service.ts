import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OAuthorizationError } from '../../common/errors/oauth.errors';
import {
  OAuth2AuthResponse,
  OAuth2TokenResponse,
  OAuth2AuthOptions,
} from '../../common/interfaces/oauth.interface';
import { SpotifyToken } from 'src/auth/entities/spotify-token.entity';
import { createSpotifyAuthConfig } from 'src/auth/providers/spotify/spotify.auth.config';
import { OAuth2Service } from 'src/auth/core/services/oauth2.service';
import { ConfigService } from '@nestjs/config';
import { SPOTIFY_OAUTH_SCOPES } from 'src/auth/common/constants/oauth-scope.constant';

@Injectable()
export class SpotifyAuthService extends OAuth2Service {
  private readonly config = createSpotifyAuthConfig(this.configService);
  constructor(
    @InjectRepository(SpotifyToken)
    private readonly spotifyTokenRepository: Repository<SpotifyToken>,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  /**
   * get auth url
   * @returns auth url
   */
  getAuthUrl(options?: OAuth2AuthOptions): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      scope: SPOTIFY_OAUTH_SCOPES.SPOTIFY.join(' '),
      redirect_uri: this.config.redirectUri,
      state: options?.state,
      show_dialog: 'true',
      access_type: 'offline',
    });

    return `${this.config.authEndpoint}?${params.toString()}`;
  }

  /**
   * get access token and refresh token
   * @param authResponse - auth response
   * @param userId - user id
   * @returns OAuth2TokenResponse
   */
  async getToken(
    authResponse: OAuth2AuthResponse,
    userId: string,
  ): Promise<OAuth2TokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: authResponse.code,
      redirect_uri: this.config.redirectUri,
    });

    const response = await fetch(this.config.tokenEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${this.config.clientId}:${this.config.clientSecret}`,
        ).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const tokens = await response.json();

    if (userId && tokens.refresh_token) {
      const result = await this.spotifyTokenRepository.save({
        userId,
        refreshToken: tokens.refresh_token,
      });
    }

    return {
      access_token: tokens.access_token,
      token_type: tokens.token_type,
      expires_in: tokens.expires_in,
      refresh_token: tokens.refresh_token,
    };
  }

  /**
   * refresh access token
   * @param userId - user id
   * @returns OAuth2TokenResponse
   */
  async refreshAccessToken(userId: string): Promise<OAuth2TokenResponse> {
    try {
      const credentials = await this.spotifyTokenRepository.findOne({
        where: { userId },
      });

      if (!credentials) {
        throw new OAuthorizationError('Refresh token not found');
      }

      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: credentials.refreshToken,
      });

      const response = await fetch(this.config.tokenEndpoint, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${this.config.clientId}:${this.config.clientSecret}`,
          ).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new OAuthorizationError(
          error.error?.message || 'Token refresh failed',
        );
      }

      const newCredentials = await response.json();

      await this.spotifyTokenRepository.update(userId, {
        refreshToken: newCredentials.refresh_token,
      });

      return {
        access_token: newCredentials.access_token,
        token_type: newCredentials.token_type,
        expires_in: newCredentials.expires_in,
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
    await this.spotifyTokenRepository.delete({ userId });
  }
}
