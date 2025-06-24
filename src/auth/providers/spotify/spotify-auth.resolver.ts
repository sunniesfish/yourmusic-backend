import { Resolver } from '@nestjs/graphql';
import { Mutation } from '@nestjs/graphql';
import { CurrentUser } from 'src/global/decorators/current-user';
import { UserInput } from 'src/user/dto/user.input';
import { AuthLevel } from '../../common/enums/auth-level.enum';
import { Auth } from 'src/global/decorators/auth.decorator';
import { SpotifyAuthService } from 'src/auth/providers/spotify/spotify-auth.service';
@Resolver()
export class SpotifyAuthResolver {
  constructor(private readonly spotifyAuthService: SpotifyAuthService) {}

  @Auth(AuthLevel.REQUIRED)
  @Mutation(() => Boolean)
  async signOut(@CurrentUser() user: UserInput) {
    await this.spotifyAuthService.signOut(user.id);
    return true;
  }
}
