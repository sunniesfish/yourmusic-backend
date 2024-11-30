import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { PlaylistService } from './playlist.service';
import { Playlist } from './entities/playlist.entity';
import { PlaylistJSON } from './dto/playlist-json.input';
import { SavePlaylistInput } from './dto/save-playlist.input';

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
  async findAll() {
    return await this.playlistService.findAll();
  }

  @Query(() => Playlist, { name: 'playlist' })
  async findOne(@Args('id', { type: () => Int }) id: number) {
    return await this.playlistService.findOne(id);
  }

  @Mutation(() => Playlist)
  async removePlaylist(@Args('id', { type: () => Int }) id: number) {
    return await this.playlistService.remove(id);
  }

  @Mutation(() => [PlaylistJSON])
  readPlaylist(@Args('link', { type: () => String }) link: string) {
    return this.playlistService.read(link);
  }

  @Mutation(() => Boolean)
  async convertToSpotifyPlaylist(
    @Args('playlistJSON', { type: () => PlaylistJSON })
    playlistJSON: PlaylistJSON,
  ) {
    return await this.playlistService.convertToSpotifyPlaylist(playlistJSON);
  }

  @Mutation(() => Boolean)
  async convertToYoutubePlaylist(
    @Args('playlistJSON', { type: () => PlaylistJSON })
    playlistJSON: PlaylistJSON,
  ) {
    return await this.playlistService.convertToYoutubePlaylist(playlistJSON);
  }
}
