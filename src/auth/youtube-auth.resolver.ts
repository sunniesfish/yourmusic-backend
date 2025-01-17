import { Resolver } from '@nestjs/graphql';
import { Mutation } from '@nestjs/graphql';
import { IsPublic } from 'src/global/decorators/ispublic';
import { GoogleAuthService } from './service/google-auth.service';
import { CurrentUser } from 'src/global/decorators/current-user';
import { User } from 'src/user/entities/user.entity';

@Resolver()
export class YoutubeAuthResolver {
  constructor(private readonly googleAuthService: GoogleAuthService) {}

  @IsPublic()
  @Mutation(() => Boolean)
  async checkYoutubeAuth(@CurrentUser() user: User) {
    return await this.googleAuthService.checkAuthStatus(user.id);
  }

  @IsPublic()
  @Mutation(() => String)
  getAuthUrl() {
    return this.googleAuthService.getAuthUrl();
  }
}
