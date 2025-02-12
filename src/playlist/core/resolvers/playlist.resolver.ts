import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  Info,
  Context,
} from '@nestjs/graphql';
import { PlaylistService } from '../services/playlist.service';
import { Playlist } from '../../entities/playlist.entity';
import {
  ConvertedPlaylist,
  PlaylistJSON,
  SavePlaylistInput,
  AuthRequiredResponse,
  ConvertPlaylistResponse,
} from 'src/playlist/common/dto/playlists.dto';
import { CurrentUser } from 'src/global/decorators/current-user';
import {
  ForbiddenException,
  UseGuards,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { UserInput } from 'src/user/dto/user.input';
import { PlaylistsResponse } from 'src/playlist/common/dto/playlists.dto';
import { GraphQLResolveInfo } from 'graphql';
import { Auth, RequireOAuth } from 'src/global/decorators/auth.decorator';
import { ApiDomain } from 'src/auth/common/enums/api-domain.enum';
import { AuthLevel } from 'src/auth/common/enums/auth-level.enum';
import { GoogleAuthService } from 'src/auth/providers/google/google-auth.service';
import { OAuthGuard } from 'src/auth/core/guards/oauth.guard';
import { GqlContext } from 'src/auth/common/interfaces/context.interface';

@Resolver(() => Playlist)
export class PlaylistResolver {
  constructor(
    @Inject()
    private readonly playlistService: PlaylistService,
    @Inject()
    private readonly googleAuthService: GoogleAuthService,
  ) {}

  @Mutation(() => Boolean)
  async savePlaylist(
    @CurrentUser() user: UserInput,
    @Args('savePlaylistInput') savePlaylistInput: SavePlaylistInput,
  ) {
    if (user === undefined || user.id === undefined) {
      throw new ForbiddenException();
    }
    await this.playlistService.create(savePlaylistInput, user.id);
    return true;
  }

  @Query(() => PlaylistsResponse, { name: 'playlistsPage' })
  async findAll(
    @CurrentUser() user: UserInput,
    @Args('page', { type: () => Int }) page: number,
    @Args('limit', { type: () => Int }) limit: number,
    @Args('orderBy', { type: () => String }) orderBy: string,
    @Info() info: GraphQLResolveInfo,
  ) {
    if (user.id === undefined) {
      console.log('user.id is undefined');
      throw new ForbiddenException();
    }

    const selections = info.fieldNodes[0].selectionSet?.selections || [];
    const playlistFields = new Set<string>();

    selections.forEach((selection) => {
      if (selection.kind === 'Field' && selection.name.value === 'playlists') {
        selection.selectionSet?.selections.forEach((field) => {
          if (field.kind === 'Field') {
            playlistFields.add(field.name.value);
          }
        });
      }
    });

    console.log('playlistFields', playlistFields);

    return await this.playlistService.findAll(
      user.id,
      page,
      limit,
      orderBy,
      Array.from(playlistFields),
    );
  }

  @Auth(AuthLevel.NONE)
  @Query(() => Playlist, { name: 'playlist' })
  async findOne(@Args('id', { type: () => Int }) id: number) {
    console.log('findOne//////////');
    return await this.playlistService.findOne(id);
  }

  @Mutation(() => Boolean)
  async removePlaylist(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user: UserInput,
  ) {
    if (user === undefined || user.id === undefined) {
      throw new ForbiddenException();
    }
    return await this.playlistService.remove(id, user.id);
  }

  @Auth(AuthLevel.NONE)
  @Mutation(() => [PlaylistJSON])
  async readPlaylist(@Args('link', { type: () => String }) link: string) {
    console.log('link', link);
    return await this.playlistService.read(link);
  }

  /**
   * @param listJSON
   * @param context
   * @returns ConvertedPlaylist
   * @description
   * 1. get accessToken from context - if logged in, get accessToken from cookie
   * 2. convert to spotify playlist - if logged in, it can retry with new accessToken
   * 3. if success, return ConvertedPlaylist
   */
  @Auth(AuthLevel.OPTIONAL)
  @UseGuards(OAuthGuard)
  @RequireOAuth(ApiDomain.SPOTIFY)
  @Mutation(() => ConvertPlaylistResponse)
  async convertToSpotifyPlaylist(
    @Context() ctx: any,
    @CurrentUser() user: UserInput,
    @Args('listJSON', { type: () => [PlaylistJSON] })
    listJSON: PlaylistJSON[],
    @Args('authorizationCode', { type: () => String, nullable: true })
    authorizationCode?: string,
    @Args('state', { type: () => String, nullable: true })
    state?: string,
  ) {
    try {
      const apiAccessToken = ctx.req.api_accessToken;

      if (!apiAccessToken && !authorizationCode) {
        throw new UnauthorizedException();
      }

      return await this.playlistService.convertToSpotifyPlaylist(
        user?.id || null,
        apiAccessToken,
        listJSON,
      );
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        return {
          needsAuth: true,
          authUrl: this.googleAuthService.getAuthUrl({
            state: state,
          }),
          apiDomain: ApiDomain.SPOTIFY,
        };
      }
      throw error;
    }
  }

  /**
   * @param listJSON
   * @param ctx
   * @returns ConvertedPlaylist
   * @description
   * 1. get accessToken from context - if logged in, get accessToken from cookie
   * 2. convert to youtube playlist - if logged in, it can retry with new accessToken
   * 3. if success, return ConvertedPlaylist
   */
  @Auth(AuthLevel.OPTIONAL)
  @UseGuards(OAuthGuard)
  @RequireOAuth(ApiDomain.YOUTUBE)
  @Mutation(() => ConvertPlaylistResponse)
  async convertToYoutubePlaylist(
    @Context() ctx: GqlContext,
    @CurrentUser() user: UserInput,
    @Args('listJSON', { type: () => [PlaylistJSON] }) listJSON: PlaylistJSON[],
    @Args('authorizationCode', { type: () => String, nullable: true })
    authorizationCode?: string,
    @Args('state', { type: () => String, nullable: true })
    state?: string,
  ): Promise<ConvertedPlaylist | AuthRequiredResponse> {
    try {
      const apiAccessToken = ctx.req.api_accessToken;

      if (!apiAccessToken && !authorizationCode) {
        throw new UnauthorizedException();
      }

      return await this.playlistService.convertToYoutubePlaylist(
        user?.id || null,
        apiAccessToken,
        listJSON,
      );
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        return {
          needsAuth: true,
          authUrl: this.googleAuthService.getAuthUrl({
            state: state,
          }),
          apiDomain: ApiDomain.YOUTUBE,
        };
      }
      throw error;
    }
  }
}
