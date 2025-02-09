import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SpotifyToken } from '../entities/spotify-token.entity';
import { spotifyAuthConfig } from '../configs/spotify.auth.config';
import {
  AuthorizationError,
  TokenRefreshError,
} from '../errors/spotify-auth.errors';
import { OAuth2Service } from './oauth2.service';
import {
  OAuth2AuthOptions,
  OAuth2AuthResponse,
  OAuth2TokenResponse,
} from '../interfaces/auth-status.interface';

@Injectable()
export class SpotifyAuthService extends OAuth2Service {
  constructor(
    @InjectRepository(SpotifyToken)
    private readonly spotifyTokenRepository: Repository<SpotifyToken>,
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
      client_id: spotifyAuthConfig.clientId,
      scope: spotifyAuthConfig.scopes.join(' '),
      redirect_uri: spotifyAuthConfig.redirectUri,
      state: options?.state,
      show_dialog: 'true',
      access_type: 'offline',
    });

    return `${spotifyAuthConfig.authEndpoint}?${params.toString()}`;
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
      redirect_uri: spotifyAuthConfig.redirectUri,
    });

    const response = await fetch(spotifyAuthConfig.tokenEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${spotifyAuthConfig.clientId}:${spotifyAuthConfig.clientSecret}`,
        ).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const tokens = await response.json();

    await this.spotifyTokenRepository.save({
      userId,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expires_in,
    });

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
    const credentials = await this.spotifyTokenRepository.findOne({
      where: { userId },
    });

    if (!credentials.refreshToken) {
      throw new AuthorizationError('Refresh token not found');
    }

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: credentials.refreshToken,
    });

    const response = await fetch(spotifyAuthConfig.tokenEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${spotifyAuthConfig.clientId}:${spotifyAuthConfig.clientSecret}`,
        ).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new TokenRefreshError(
        error.error?.message || 'Token refresh failed',
      );
    }

    const newCredentials = await response.json();

    await this.spotifyTokenRepository.update(userId, {
      expiresAt: new Date(Date.now() + newCredentials.expires_in * 1000),
      refreshToken: newCredentials.refresh_token,
    });

    return {
      access_token: newCredentials.access_token,
      token_type: newCredentials.token_type,
      expires_in: newCredentials.expires_in,
      refresh_token: newCredentials.refresh_token,
    };
  }

  /**
   * sign out
   * @param userId - user id
   */
  async signOut(userId: string): Promise<void> {
    await this.spotifyTokenRepository.delete({ userId });
  }
}
