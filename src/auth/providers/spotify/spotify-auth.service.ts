import { Inject, Injectable } from '@nestjs/common';
import { OAuthorizationError } from '../../common/errors/oauth.errors';
import {
  OAuth2AuthResponse,
  OAuth2TokenResponse,
  OAuth2AuthOptions,
} from '../../common/interfaces/oauth.interface';
import { createSpotifyAuthConfig } from 'src/auth/providers/spotify/spotify.auth.config';
import { OAuth2Service } from 'src/auth/core/services/oauth2.service';
import { ConfigService } from '@nestjs/config';
import { SPOTIFY_OAUTH_SCOPES } from 'src/auth/common/constants/oauth-scope.constant';
import { UserService } from 'src/user/services/user.service';
import { Firestore } from '@google-cloud/firestore';

@Injectable()
export class SpotifyAuthService extends OAuth2Service {
  private readonly config = createSpotifyAuthConfig(this.configService);
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    @Inject('FIRESTORE')
    private readonly firestore: Firestore,
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
    try {
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
        await this.userService.update({
          userId,
          spotifyToken: {
            refreshToken: tokens.refresh_token,
            expiryDate: tokens.expires_in,
            tokenType: tokens.token_type,
          },
        });
      }

      return {
        access_token: tokens.access_token,
        token_type: tokens.token_type,
        expires_in: tokens.expires_in,
        refresh_token: tokens.refresh_token,
      };
    } catch (error) {
      throw new OAuthorizationError('Failed to get token');
    }
  }

  /**
   * refresh access token
   * @param userId - user id
   * @returns OAuth2TokenResponse
   */
  async refreshAccessToken(userId: string): Promise<OAuth2TokenResponse> {
    return await this.firestore.runTransaction(async (transaction) => {
      const credentials = await this.userService.findOne(
        userId,
        ['spotifyToken'],
        transaction,
      );

      if (!credentials) {
        throw new OAuthorizationError('Refresh token not found');
      }

      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: credentials.spotifyToken.refreshToken,
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

      await this.userService.update(
        {
          userId,
          spotifyToken: {
            refreshToken: newCredentials.refresh_token,
            expiryDate: newCredentials.expires_in,
            tokenType: newCredentials.token_type,
          },
        },
        transaction,
      );

      return {
        access_token: newCredentials.access_token,
        token_type: newCredentials.token_type,
        expires_in: newCredentials.expires_in,
        refresh_token: newCredentials.refresh_token,
      };
    });
  }

  /**
   * sign out
   * @param userId - user id
   */
  async signOut(userId: string): Promise<void> {
    try {
      await this.userService.update({
        userId,
        spotifyToken: {
          refreshToken: null,
          expiryDate: 0,
          tokenType: null,
        },
      });
    } catch (error) {
      throw new OAuthorizationError('Failed to sign out');
    }
  }
}
