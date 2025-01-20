import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CanActivate } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { OAUTH_TYPE_KEY } from 'src/global/decorators/auth.decorator';
import { SpotifyAuthService } from '../service/spotify-auth.service';
import { GoogleAuthService } from '../service/google-auth.service';
import { OAuthType } from 'src/global/decorators/auth.decorator';
import { AuthStatus } from '../interfaces/auth-status.interface';

@Injectable()
export class OAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private spotifyAuthService: SpotifyAuthService,
    private googleAuthService: GoogleAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const oauthType = this.reflector.get<OAuthType>(
      OAUTH_TYPE_KEY,
      context.getHandler(),
    );

    if (!oauthType) {
      return true;
    }

    const ctx = GqlExecutionContext.create(context);
    const { user } = ctx.getContext().req;

    if (!user) {
      throw new UnauthorizedException(
        'Authentication required for OAuth operations',
      );
    }

    const authStatus = await this.checkOAuthStatus(oauthType, user.userId);

    if (!authStatus.isAuthenticated) {
      throw new UnauthorizedException(
        authStatus.message || 'OAuth authentication required',
      );
    }
    ctx.getContext().req.authStatus = authStatus;
    return true;
  }

  private async checkOAuthStatus(
    type: OAuthType,
    userId: string,
  ): Promise<AuthStatus> {
    switch (type) {
      case 'spotify':
        return await this.spotifyAuthService.checkAuthStatus(userId);
      case 'youtube':
        return await this.googleAuthService.checkAuthStatus(userId);
      default:
        throw new Error('Invalid OAuth type');
    }
  }
}
