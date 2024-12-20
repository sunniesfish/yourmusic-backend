import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, lastValueFrom } from 'rxjs';
import { GoogleAuthService } from '../service/google-auth.service';
import ApiRateLimiter from '@sunniesfish/api-rate-limiter';

@Injectable()
export class YouTubeAuthInterceptor implements NestInterceptor {
  private apiRateLimiter: ApiRateLimiter<any>;

  constructor(
    private readonly googleAuthService: GoogleAuthService,
    private readonly reflector: Reflector,
  ) {
    this.apiRateLimiter = new ApiRateLimiter(
      {
        maxPerSecond: 3,
        maxPerMinute: 60,
        maxQueueSize: 100,
      },
      (error) => {
        console.error('YouTube API Rate Limit Error:', error);
        throw new Error('YouTube API rate limit exceeded');
      },
    );
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const options = this.reflector.get<boolean>(
      'YOUTUBE_AUTH',
      context.getHandler(),
    );

    if (!options) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return new Observable((subscriber) => {
      this.apiRateLimiter.addRequest(async () => {
        try {
          const oauth2Client =
            await this.googleAuthService.getOAuthClientForUser(user.id);

          request.oauth2Client = oauth2Client;

          const result = await lastValueFrom(next.handle());
          subscriber.next(result);
          subscriber.complete();
        } catch (error) {
          subscriber.error(error);
        }
      });
    });
  }
}
