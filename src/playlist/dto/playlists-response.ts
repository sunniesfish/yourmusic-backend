import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Playlist } from '../entities/playlist.entity';

@ObjectType('PlaylistsResponse')
export class PlaylistsResponse {
  @Field(() => [Playlist])
  playlists: Playlist[];

  @Field(() => Int)
  totalPages: number;
}
