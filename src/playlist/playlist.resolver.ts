import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  Info,
  Context,
} from '@nestjs/graphql';
import { PlaylistService } from './playlist.service';
import { Playlist } from './entities/playlist.entity';
import {
  ConvertedPlaylist,
  PlaylistJSON,
  SavePlaylistInput,
} from './dto/playlists.dto';
import {
  CurrentUser,
  CurrentUserType,
} from 'src/global/decorators/current-user';
import { ForbiddenException, UseGuards } from '@nestjs/common';
import { UserInput } from 'src/user/dto/user.input';
import { PlaylistsResponse } from './dto/playlists.dto';
import { GraphQLResolveInfo } from 'graphql';
import { Auth, RequireOAuth } from 'src/global/decorators/auth.decorator';
import { OAuthGuard } from 'src/auth/guards/oauth.guard';
import { ApiDomain } from 'src/auth/enums/api-domain.enum';
import { AuthLevel } from 'src/auth/enums/auth-level.enum';

@Resolver(() => Playlist)
export class PlaylistResolver {
  constructor(private readonly playlistService: PlaylistService) {}

  @Mutation(() => Boolean)
  async savePlaylist(
    @CurrentUser() user: UserInput,
    @Args('savePlaylistInput') savePlaylistInput: SavePlaylistInput,
  ) {
    if (user.id === undefined) {
      throw new ForbiddenException();
    }
    await this.playlistService.create(savePlaylistInput, user.id);
    return true;
  }

  @Query(() => PlaylistsResponse, {
    name: 'playlistsPage',
  })
  async findAll(
    @CurrentUser() user: UserInput,
    @Args('page', { type: () => Int }) page: number,
    @Args('limit', { type: () => Int }) limit: number,
    @Args('orderBy', { type: () => String }) orderBy: string,
    @Info() info: GraphQLResolveInfo,
  ) {
    if (user.id === undefined) {
      throw new ForbiddenException();
    }

    const selections = info.fieldNodes[0].selectionSet?.selections || [];
    const requestedFields = selections.reduce(
      (acc, field) => {
        if ('name' in field) {
          return { ...acc, [field.name.value]: true };
        }
        return acc;
      },
      {} as Record<string, boolean>,
    );

    return await this.playlistService.findAll(
      user.id,
      page,
      limit,
      orderBy,
      Object.keys(requestedFields) as Array<keyof Playlist>,
    );
  }

  @Query(() => Playlist, { name: 'playlist' })
  async findOne(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user: UserInput,
  ) {
    if (user.id === undefined) {
      throw new ForbiddenException();
    }
    return await this.playlistService.findOne(id, user.id);
  }

  @Mutation(() => Playlist)
  async removePlaylist(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user: UserInput,
  ) {
    if (user.id === undefined) {
      throw new ForbiddenException();
    }
    return await this.playlistService.remove(id, user.id);
  }

  @Auth(AuthLevel.NONE)
  @Mutation(() => [PlaylistJSON])
  async readPlaylist(@Args('link', { type: () => String }) link: string) {
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
  @Mutation(() => ConvertedPlaylist)
  async convertToSpotifyPlaylist(
    @Context() ctx: any,
    @CurrentUser() user: CurrentUserType,
    @Args('listJSON', { type: () => [PlaylistJSON] })
    listJSON: PlaylistJSON[],
  ) {
    const accessToken = ctx.accessToken;
    return await this.playlistService.convertToSpotifyPlaylist(
      user.id,
      accessToken,
      listJSON,
    );
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
  @Mutation(() => ConvertedPlaylist)
  async convertToYoutubePlaylist(
    @Context() ctx: any,
    @CurrentUser() user: CurrentUserType,
    @Args('listJSON', { type: () => [PlaylistJSON] })
    listJSON: PlaylistJSON[],
  ) {
    const accessToken = ctx.accessToken;
    return await this.playlistService.convertToYoutubePlaylist(
      user.id,
      accessToken,
      listJSON,
    );
  }
}
