import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OAUTH_TYPE_KEY } from '../../global/decorators/auth.decorator';
import { ApiDomain } from '../enums/api-domain.enum';
import { SpotifyAuthService } from '../service/spotify-auth.service';
import { GoogleAuthService } from '../service/google-auth.service';
import { OAuth2TokenResponse } from '../interfaces/auth-status.interface';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GqlContext } from '../interfaces/auth-status.interface';

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

    if (!accessToken && authCode) {
      try {
        const newToken = await this.getNewToken(apiDomain, authCode, userId);
        ctx.req.api_accessToken = newToken.access_token;
        ctx.res.cookie(`${apiDomain}_access_token`, newToken.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
        });
        return true;
      } catch (error) {
        throw new UnauthorizedException('Failed to get access token', {
          cause: error,
        });
      }
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
}
