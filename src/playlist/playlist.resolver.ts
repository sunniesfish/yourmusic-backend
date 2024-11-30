import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { PlaylistService } from './playlist.service';
import { Playlist } from '../../entities/playlist.entity';
import { CreatePlaylistInput } from '../../dto/create-playlist.input';
import { UpdatePlaylistInput } from '../../dto/update-playlist.input';

@Resolver(() => Playlist)
export class PlaylistResolver {
  constructor(private readonly playlistService: PlaylistService) {}

  @Mutation(() => Playlist)
  createPlaylist(
    @Args('createPlaylistInput') createPlaylistInput: CreatePlaylistInput,
  ) {
    return this.playlistService.create(createPlaylistInput);
  }

  @Query(() => [Playlist], { name: 'playlist' })
  findAll() {
    return this.playlistService.findAll();
  }

  @Query(() => Playlist, { name: 'playlist' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.playlistService.findOne(id);
  }

  @Mutation(() => Playlist)
  updatePlaylist(
    @Args('updatePlaylistInput') updatePlaylistInput: UpdatePlaylistInput,
  ) {
    return this.playlistService.update(
      updatePlaylistInput.id,
      updatePlaylistInput,
    );
  }

  @Mutation(() => Playlist)
  removePlaylist(@Args('id', { type: () => Int }) id: number) {
    return this.playlistService.remove(id);
  }
}
