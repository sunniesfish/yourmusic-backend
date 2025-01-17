import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SpotifyToken } from '../entities/spotify-token.entity';
import { spotifyAuthConfig } from '../configs/spotify.auth.config';
import { AuthStatus } from '../interfaces/auth-status.interface';
import {
  AuthorizationError,
  TokenRefreshError,
} from '../errors/spotify-auth.errors';
import { SpotifyTokenResponse } from '../interfaces/spotify-auth.interfaces';

@Injectable()
export class SpotifyAuthService {
  constructor(
    @InjectRepository(SpotifyToken)
    private readonly spotifyTokenRepository: Repository<SpotifyToken>,
  ) {}

  getAuthUrl(): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: spotifyAuthConfig.clientId,
      scope: spotifyAuthConfig.scopes.join(' '),
      redirect_uri: spotifyAuthConfig.redirectUri,
      state: this.generateRandomString(16),
      show_dialog: 'true',
      access_type: 'offline',
    });

    return `${spotifyAuthConfig.authEndpoint}?${params.toString()}`;
  }

  async getToken(code: string, userId: string) {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
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
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    });

    return tokens;
  }

  async refreshAccessToken(
    userId: string,
    refreshToken: string,
  ): Promise<SpotifyTokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
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
      throw new TokenRefreshError(error.error?.message || '토큰 갱신 실패');
    }

    const tokens: SpotifyTokenResponse = await response.json();

    await this.spotifyTokenRepository.update(
      { userId },
      {
        accessToken: tokens.access_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        ...(tokens.refresh_token && { refreshToken: tokens.refresh_token }),
      },
    );

    return tokens;
  }

  async checkAuthStatus(userId: string): Promise<AuthStatus> {
    try {
      const token = await this.spotifyTokenRepository.findOne({
        where: { userId },
      });

      if (!token) {
        return {
          isAuthenticated: false,
          needsReauth: true,
          message: 'Authentication is required',
        };
      }

      const isExpired = token.expiresAt < new Date();

      if (isExpired && !token.refreshToken) {
        return {
          isAuthenticated: false,
          needsReauth: true,
          message: 'Reauthentication is required',
        };
      }

      if (isExpired) {
        try {
          await this.refreshAccessToken(userId, token.refreshToken);
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

  private generateRandomString(length: number): string {
    const possible =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  async getSpotifyApi(userId: string) {
    const token = await this.spotifyTokenRepository.findOne({
      where: { userId },
    });

    if (!token) {
      throw new AuthorizationError('Token not found');
    }

    if (token.expiresAt < new Date()) {
      if (!token.refreshToken) {
        throw new TokenRefreshError('Refresh token is not available');
      }

      try {
        const newToken = await this.refreshAccessToken(
          userId,
          token.refreshToken,
        );
        return {
          accessToken: newToken.access_token,
          expiresAt: new Date(Date.now() + newToken.expires_in * 1000),
        };
      } catch (error) {
        throw new TokenRefreshError(error.message);
      }
    }

    return {
      accessToken: token.accessToken,
      expiresAt: token.expiresAt,
    };
  }
}
