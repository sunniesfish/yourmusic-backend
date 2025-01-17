import { Resolver, Query, Mutation, Args, Int, Info } from '@nestjs/graphql';
import { PlaylistService } from './playlist.service';
import { Playlist } from './entities/playlist.entity';
import { PlaylistJSON } from './dto/playlist-json.input';
import { SavePlaylistInput } from './dto/save-playlist.input';
import { CurrentUser } from 'src/global/decorators/current-user';
import { ForbiddenException } from '@nestjs/common';
import { IsPublic } from 'src/global/decorators/ispublic';
import { UserInput } from 'src/user/dto/user.input';
import { PlaylistsResponse } from './dto/playlists-response';
import { GraphQLResolveInfo } from 'graphql';
import { UnauthorizedException } from '@nestjs/common';
import { YouTubeAuthError } from './errors/youtube.errors';

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

  @IsPublic()
  @Mutation(() => [PlaylistJSON])
  async readPlaylist(@Args('link', { type: () => String }) link: string) {
    return await this.playlistService.read(link);
  }

  // @IsPublic()
  // @Mutation(() => Boolean)
  // async convertToSpotifyPlaylist(
  //   @Args('listJSON', { type: () => [PlaylistJSON] })
  //   listJSON: PlaylistJSON[],
  // ) {
  //   return await this.playlistService.convertToSpotifyPlaylist();
  // }

  @IsPublic()
  @Mutation(() => Boolean)
  async convertToYoutubePlaylist(
    @CurrentUser() user: UserInput,
    @Args('listJSON', { type: () => [PlaylistJSON] })
    listJSON: PlaylistJSON[],
  ) {
    try {
      return await this.playlistService.convertToYoutubePlaylist(
        user.id,
        listJSON,
      );
    } catch (error) {
      if (error instanceof YouTubeAuthError) {
        throw new UnauthorizedException({
          message: error.message,
          code: 'YOUTUBE_AUTH_REQUIRED',
        });
      }
      throw error;
    }
  }
}
