import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { PlaylistService } from './playlist.service';
import { Playlist } from './entities/playlist.entity';
import { PlaylistJSON } from './dto/playlist-json.input';
import { SavePlaylistInput } from './dto/save-playlist.input';
import { User } from 'src/user/entities/user.entity';
import { CurrentUser } from 'src/global/decorators/current-user';
import { ForbiddenException } from '@nestjs/common';
import { IsPublic } from 'src/global/decorators/ispublic';

@Resolver(() => Playlist)
export class PlaylistResolver {
  constructor(private readonly playlistService: PlaylistService) {}

  @Mutation(() => Playlist)
  async savePlaylist(
    @Args('savePlaylistInput') savePlaylistInput: SavePlaylistInput,
  ) {
    return await this.playlistService.create(savePlaylistInput);
  }

  @Query(() => [Playlist], { name: 'playlist' })
  async findAll(@CurrentUser() user: User) {
    if (user.id === undefined) {
      throw new ForbiddenException();
    }
    return await this.playlistService.findAll(user.id);
  }

  @Query(() => Playlist, { name: 'playlist' })
  async findOne(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user: User,
  ) {
    if (user.id === undefined) {
      throw new ForbiddenException();
    }
    return await this.playlistService.findOne(id, user.id);
  }

  @Mutation(() => Playlist)
  async removePlaylist(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user: User,
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

  @IsPublic()
  @Mutation(() => Boolean)
  async convertToSpotifyPlaylist(
    @Args('playlistJSON', { type: () => PlaylistJSON })
    playlistJSON: PlaylistJSON,
  ) {
    return await this.playlistService.convertToSpotifyPlaylist(playlistJSON);
  }

  @IsPublic()
  @Mutation(() => Boolean)
  async convertToYoutubePlaylist(
    @Args('playlistJSON', { type: () => PlaylistJSON })
    playlistJSON: PlaylistJSON,
  ) {
    return await this.playlistService.convertToYoutubePlaylist(playlistJSON);
  }
}
