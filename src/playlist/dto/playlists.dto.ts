import { ObjectType, Field, Int, InputType } from '@nestjs/graphql';
import { Playlist } from '../entities/playlist.entity';

/**
 * @description
 * 1. PlaylistResponse
 * 2. PlaylistJSON
 * 3. SavePlaylistInput
 */
@ObjectType('PlaylistsResponse')
export class PlaylistsResponse {
  @Field(() => [Playlist])
  playlists: Playlist[];

  @Field(() => Int)
  totalPages: number;
}

/**
 * @description
 * 1. SavePlaylistInput
 */
@InputType()
export class SavePlaylistInput {
  @Field()
  name: string;

  @Field(() => [PlaylistJSON])
  listJson: PlaylistJSON[];
}

/**
 * @description
 * 1. PlaylistJSON
 */
@ObjectType('PlaylistJSON')
@InputType('PlaylistJSONInput')
export class PlaylistJSON {
  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  artist?: string;

  @Field({ nullable: true })
  album?: string;

  @Field({ nullable: true })
  thumbnail?: string;
}

@ObjectType('ConvertedPlaylist')
export class ConvertedPlaylist {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => String)
  message: string;

  @Field(() => String, { nullable: true })
  playlistId?: string;

  @Field(() => String, { nullable: true })
  playlistName?: string;

  @Field(() => String, { nullable: true })
  playlistUrl?: string;
}
