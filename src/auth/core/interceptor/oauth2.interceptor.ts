import {
  Injectable,
  NestInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';
import { ExecutionContext } from '@nestjs/common';
import { CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GoogleAuthService } from 'src/auth/providers/google/google-auth.service';
import { SpotifyAuthService } from 'src/auth/providers/spotify/spotify-auth.service';
import { ApiDomain } from 'src/auth/common/enums/api-domain.enum';
import { OAuth2Service } from '../services/oauth2.service';
import { GqlContext } from 'src/auth/common/interfaces/context.interface';
import { OAUTH_TYPE_KEY } from 'src/global/decorators/auth.decorator';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PlatformAuthError } from 'src/playlist/common/errors/platform.errors';

@Injectable()
export class OAuth2Interceptor implements NestInterceptor {
  private readonly MAX_RETRIES = 2;

  constructor(
    private readonly reflector: Reflector,
    private readonly googleAuthService: GoogleAuthService,
    private readonly spotifyAuthService: SpotifyAuthService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError(async (error) => {
        const apiDomain = this.reflector.get<ApiDomain>(
          OAUTH_TYPE_KEY,
          context.getHandler(),
        );
        if (!apiDomain) {
          return throwError(() => error);
        }
        if (!this.isExternal401Error(error)) {
          return throwError(() => error);
        }

        const retryCount = this.getRetryCount(context);
        if (retryCount >= this.MAX_RETRIES) {
          return throwError(
            () =>
              new UnauthorizedException(
                'Token Refresh Failed after maximum attempts',
              ),
          );
        }
        const gqlContext = GqlExecutionContext.create(context);
        const ctx = gqlContext.getContext();
        const userId = ctx.req.user.id;

        if (!userId) {
          return throwError(() => new UnauthorizedException('User not found'));
        }

        try {
          const newAccessToken = await this.refreshToken(userId, apiDomain);

          this.updateContext(ctx, apiDomain, newAccessToken);
          this.incrementRetryCount(context);

          const handler = context.getHandler();
          return await handler.apply(this, [gqlContext.getArgs()]);
        } catch (refreshError) {
          return throwError(
            () => new UnauthorizedException('Token Refresh Failed'),
          );
        } finally {
          this.resetRetryCount(context);
        }
      }),
    );
  }

  private isExternal401Error(error: any): boolean {
    return error instanceof PlatformAuthError;
  }
  private getRetryCount(context: ExecutionContext): number {
    return Reflect.getMetadata('retryCount', context.getHandler()) || 0;
  }

  private incrementRetryCount(context: ExecutionContext): void {
    const currentCount = this.getRetryCount(context);
    Reflect.defineMetadata(
      'retryCount',
      currentCount + 1,
      context.getHandler(),
    );
  }

  private resetRetryCount(context: ExecutionContext): void {
    Reflect.defineMetadata('retryCount', 0, context.getHandler());
  }

  private async refreshToken(
    userId: string,
    apiDomain: ApiDomain,
  ): Promise<string> {
    const service: OAuth2Service | null =
      apiDomain === ApiDomain.YOUTUBE
        ? this.googleAuthService
        : apiDomain === ApiDomain.SPOTIFY
          ? this.spotifyAuthService
          : null;

    if (!service) {
      throw new Error('Invalid API domain');
    }

    const token = await service.refreshAccessToken(userId);
    return token.access_token;
  }

  private updateContext(
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
