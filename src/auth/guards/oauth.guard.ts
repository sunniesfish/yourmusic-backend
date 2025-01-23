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

@Injectable()
export class OAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly googleAuthService: GoogleAuthService,
    private readonly spotifyAuthService: SpotifyAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    //check if the apiDomain is provided
    const apiDomain = this.reflector.get<ApiDomain>(
      OAUTH_TYPE_KEY,
      context.getHandler(),
    );
    if (!apiDomain) {
      return true;
    }

    //check if the accessToken is provided
    const request = context.switchToHttp().getRequest();
    const accessToken = this.extractAccessToken(request, apiDomain);
    const userId = request.user.id;

    //if the accessToken is not provided, get the accessToken with the authorization code
    if (!accessToken) {
      const authResponse = request.body.authorizationCode;
      if (!authResponse) {
        throw new UnauthorizedException('Authorization code is required');
      }

      let newToken: OAuth2TokenResponse;

      //check the apiDomain and get the accessToken
      if (apiDomain === ApiDomain.YOUTUBE) {
        newToken = await this.googleAuthService.getToken(authResponse, userId);
      } else if (apiDomain === ApiDomain.SPOTIFY) {
        newToken = await this.spotifyAuthService.getToken(authResponse, userId);
      }
      request.accessToken = newToken.access_token;
      return true;
    }

    //if the accessToken is provided, set the accessToken
    request.accessToken = accessToken;
    return true;
  }

  private extractAccessToken(
    request: any,
    apiDomain: ApiDomain,
  ): string | null {
    const cookieName = `${apiDomain}_access_token`;
    const cookies = request.cookies;
    return cookies?.[cookieName] || null;
  }
}
