import { Resolver } from '@nestjs/graphql';
import { Mutation } from '@nestjs/graphql';
import { CurrentUser } from 'src/global/decorators/current-user';
import { User } from 'src/user/entities/user.entity';
import { AuthLevel } from '../../common/enums/auth-level.enum';
import { Auth } from 'src/global/decorators/auth.decorator';
import { GoogleAuthService } from 'src/auth/providers/google/google-auth.service';

@Resolver()
export class YoutubeAuthResolver {
  constructor(private readonly googleAuthService: GoogleAuthService) {}

  @Auth(AuthLevel.REQUIRED)
  @Mutation(() => Boolean)
  async signOut(@CurrentUser() user: User) {
    await this.googleAuthService.signOut(user.id);
    return true;
  }
}
