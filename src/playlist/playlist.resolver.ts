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
import { CurrentUser } from 'src/global/decorators/current-user';
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
  @Mutation(() => ConvertedPlaylist)
  async convertToSpotifyPlaylist(
    @Context() ctx: any,
    @CurrentUser() user: UserInput,
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
    @CurrentUser() user: UserInput,
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
