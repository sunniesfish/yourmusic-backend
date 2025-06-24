import { Resolver } from '@nestjs/graphql';
import { Mutation } from '@nestjs/graphql';
import { CurrentUser } from 'src/global/decorators/current-user';
import { AuthLevel } from '../../common/enums/auth-level.enum';
import { Auth } from 'src/global/decorators/auth.decorator';
import { GoogleAuthService } from 'src/auth/providers/google/google-auth.service';
import { UserInput } from 'src/user/dto/user.input';
@Resolver()
export class YoutubeAuthResolver {
  constructor(private readonly googleAuthService: GoogleAuthService) {}

  @Auth(AuthLevel.REQUIRED)
  @Mutation(() => Boolean)
  async signOut(@CurrentUser() user: UserInput) {
    await this.googleAuthService.signOut(user.id);
    return true;
  }
}
