import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable, throwError, from, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { SpotifyAuthService } from 'src/auth/providers/spotify/spotify-auth.service';
import { GoogleAuthService } from 'src/auth/providers/google/google-auth.service';
import { OAuthorizationError } from 'src/auth/common/errors/oauth.errors';
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
    const state = gqlContext.getArgs().state;
    const apiDomain = this.reflector.get<ApiDomain>(
      OAUTH_TYPE_KEY,
      context.getHandler(),
    );
    return next.handle().pipe(
      catchError((error) => {
        if (error instanceof OAuthorizationError) {
          if (apiDomain === ApiDomain.SPOTIFY) {
            return of({
              needsAuth: true,
              authUrl: this.spotifyAuthService.getAuthUrl({
                state: state,
              }),
              apiDomain: apiDomain,
            });
          }
          if (apiDomain === ApiDomain.YOUTUBE) {
            return of({
              needsAuth: true,
              authUrl: this.googleAuthService.getAuthUrl({
                state: state,
              }),
              apiDomain: apiDomain,
            });
          }
        }

        return throwError(() => error);
      }),
    );
  }
}
