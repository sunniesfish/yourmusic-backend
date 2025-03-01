import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable, throwError, from, of } from 'rxjs';
import {
  catchError,
  retryWhen,
  mergeMap,
  tap,
  delay,
  take,
  switchMap,
} from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { SpotifyAuthService } from 'src/auth/providers/spotify/spotify-auth.service';
import { GoogleAuthService } from 'src/auth/providers/google/google-auth.service';
import {
  OAuthenticationError,
  OAuthorizationError,
} from 'src/auth/common/errors/oauth.errors';
import { GqlContext } from '../../common/interfaces/context.interface';
import { ApiDomain } from '../../common/enums/api-domain.enum';
import { OAUTH_TYPE_KEY } from '../../../global/decorators/auth.decorator';

interface RefreshAttemptState {
  count: number;
  inProgress: boolean;
}

@Injectable()
export class OAuthErrorInterceptor implements NestInterceptor {
  private readonly MAX_REFRESH_ATTEMPTS = 3;
  private refreshAttempts = new Map<string, RefreshAttemptState>();
  private static readonly INTERCEPTOR_EXECUTED = 'OAUTH_INTERCEPTOR_EXECUTED';

  constructor(
    private readonly reflector: Reflector,
    private readonly googleAuthService: GoogleAuthService,
    private readonly spotifyAuthService: SpotifyAuthService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const gqlContext = GqlExecutionContext.create(context);
    const ctx = gqlContext.getContext<GqlContext>();

    if (ctx.req[OAuthErrorInterceptor.INTERCEPTOR_EXECUTED]) {
      return next.handle();
    }

    ctx.req[OAuthErrorInterceptor.INTERCEPTOR_EXECUTED] = true;

    return next.handle().pipe(
      catchError((error) => {
        if (
          !(error instanceof OAuthenticationError) &&
          !(error instanceof OAuthorizationError)
        ) {
          return throwError(() => error);
        }

        const apiDomain = this.reflector.get<ApiDomain>(
          OAUTH_TYPE_KEY,
          context.getHandler(),
        );
        const userId = ctx.req.user?.id;

        if (!apiDomain) {
          return throwError(() => error);
        }

        if (error instanceof OAuthorizationError) {
          ctx.req.needsAuthUrl = true;

          return next.handle();
        }

        if (error instanceof OAuthenticationError) {
          if (userId) {
            const key = `${userId}:${apiDomain}`;
            if (!this.refreshAttempts.has(key)) {
              this.refreshAttempts.set(key, { count: 0, inProgress: false });
            }

            const attempt = this.refreshAttempts.get(key)!;

            if (attempt.count >= this.MAX_REFRESH_ATTEMPTS) {
              ctx.req.needsAuthUrl = true;
              this.refreshAttempts.delete(key);
              return next.handle();
            }

            if (attempt.inProgress) {
              return throwError(
                () => new HttpException('Token refresh in progress', 429),
              );
            }

            attempt.count += 1;
            attempt.inProgress = true;

            return from(this.refreshAccessToken(apiDomain, userId)).pipe(
              tap((response) => {
                this.setAccessTokenToContext(
                  ctx,
                  apiDomain,
                  response.access_token,
                );

                const currentAttempt = this.refreshAttempts.get(key);
                if (currentAttempt) {
                  currentAttempt.inProgress = false;
                }
              }),

              switchMap(() => next.handle()),
              catchError((refreshError) => {
                const currentAttempt = this.refreshAttempts.get(key);
                if (currentAttempt) {
                  currentAttempt.inProgress = false;
                }

                ctx.req.needsAuthUrl = true;
                return next.handle();
              }),
            );
          } else {
            ctx.req.needsAuthUrl = true;
            return next.handle();
          }
        }

        return throwError(() => error);
      }),
    );
  }

  private async refreshAccessToken(apiDomain: ApiDomain, userId: string) {
    if (apiDomain === ApiDomain.YOUTUBE) {
      return await this.googleAuthService.refreshAccessToken(userId);
    }
    if (apiDomain === ApiDomain.SPOTIFY) {
      return await this.spotifyAuthService.refreshAccessToken(userId);
    }
    throw new Error('Invalid API domain');
  }

  private setAccessTokenToContext(
    ctx: GqlContext,
    apiDomain: ApiDomain,
    accessToken: string,
  ) {
    ctx.req.api_accessToken = accessToken;
    ctx.req.needsAuthUrl = false;
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
