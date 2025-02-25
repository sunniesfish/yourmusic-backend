import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OAUTH_TYPE_KEY } from '../../../global/decorators/auth.decorator';
import { ApiDomain } from '../../common/enums/api-domain.enum';
import { GqlExecutionContext } from '@nestjs/graphql';
import { SpotifyAuthService } from 'src/auth/providers/spotify/spotify-auth.service';
import { GoogleAuthService } from 'src/auth/providers/google/google-auth.service';
import { OAuth2TokenResponse } from '../../common/interfaces/oauth.interface';
import { GqlContext } from '../../common/interfaces/context.interface';
/**
 * Guard that handles OAuth2 authentication for different API domains (YouTube, Spotify)
 * Validates access tokens and handles token refresh using authorization codes
 */
@Injectable()
export class OAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly googleAuthService: GoogleAuthService,
    private readonly spotifyAuthService: SpotifyAuthService,
  ) {}

  /**
   * Validates the request and handles OAuth2 authentication
   * @param context - Execution context containing the request information
   * @returns Promise resolving to boolean indicating if the request is authorized
   * @throws UnauthorizedException when token retrieval fails
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlContext = GqlExecutionContext.create(context);
    const ctx = gqlContext.getContext<GqlContext>();
    const apiDomain = this.reflector.get<ApiDomain>(
      OAUTH_TYPE_KEY,
      context.getHandler(),
    );

    if (!apiDomain) return true;

    const accessToken = this.extractAccessToken(ctx.req, apiDomain);
    const userId = ctx.req.user?.id;
    const authCode = gqlContext.getArgs().authorizationCode;

    console.log('///////////////accessToken', accessToken);
    console.log('///////////////authCode', authCode);
    console.log('///////////////userId', userId);

    if (!accessToken && authCode) {
      try {
        const authResponse = await this.getNewToken(
          apiDomain,
          authCode,
          userId,
        );
        this.setAccessTokenToContext(ctx, apiDomain, authResponse.access_token);
        return true;
      } catch (error) {
        throw new UnauthorizedException('Failed to get access token', {
          cause: error,
        });
      }
    }
    if (!accessToken && !authCode && userId) {
      try {
        const authResponse = await this.refreshAccessToken(apiDomain, userId);
        this.setAccessTokenToContext(ctx, apiDomain, authResponse.access_token);
        return true;
      } catch (error) {}
    }

    ctx.req.api_accessToken = accessToken;
    return true;
  }

  /**
   * Extracts the access token from request cookies for the specified API domain
   * @param request - HTTP request object containing cookies
   * @param apiDomain - API domain to extract the token for (YouTube or Spotify)
   * @returns Access token string if found, null otherwise
   */
  private extractAccessToken(
    request: any,
    apiDomain: ApiDomain,
  ): string | null {
    const cookieName = `${apiDomain}_access_token`;
    const cookies = request.cookies;
    return cookies?.[cookieName] || null;
  }

  /**
   * Retrieves a new OAuth2 token using the authorization code
   * @param apiDomain - API domain to get the token for (YouTube or Spotify)
   * @param authCode - Authorization code from OAuth2 callback
   * @param userId - Optional user ID to associate with the token
   * @returns Promise resolving to OAuth2TokenResponse containing the new tokens
   * @throws UnauthorizedException for invalid API domains
   */
  private async getNewToken(
    apiDomain: ApiDomain,
    authCode: string,
    userId: string | undefined,
  ): Promise<OAuth2TokenResponse> {
    if (apiDomain === ApiDomain.YOUTUBE) {
      return await this.googleAuthService.getToken(
        { code: authCode, state: 'state' },
        userId,
      );
    }
    if (apiDomain === ApiDomain.SPOTIFY) {
      return await this.spotifyAuthService.getToken(
        { code: authCode, state: 'state' },
        userId,
      );
    }
    throw new UnauthorizedException('Invalid API domain');
  }

  private async refreshAccessToken(
    apiDomain: ApiDomain,
    userId: string,
  ): Promise<OAuth2TokenResponse> {
    if (apiDomain === ApiDomain.YOUTUBE) {
      return await this.googleAuthService.refreshAccessToken(userId);
    }
    if (apiDomain === ApiDomain.SPOTIFY) {
      return await this.spotifyAuthService.refreshAccessToken(userId);
    }
    throw new UnauthorizedException('Invalid API domain');
  }

  private setAccessTokenToContext(
    ctx: GqlContext,
    apiDomain: ApiDomain,
    accessToken: string,
  ) {
    ctx.req.api_accessToken = accessToken;
    ctx.res.cookie(`${apiDomain}_access_token`, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      domain:
        process.env.NODE_ENV === 'production'
          ? process.env.CORS_ORIGIN_PROD
          : 'localhost',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });
  }
}
