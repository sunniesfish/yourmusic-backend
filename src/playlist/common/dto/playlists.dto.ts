import {
  ObjectType,
  Field,
  Int,
  InputType,
  createUnionType,
} from '@nestjs/graphql';
import { ApiDomain } from 'src/auth/common/enums/api-domain.enum';
import { Playlist } from 'src/playlist/entities/playlist.entity';

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
export class MutatePlaylistInput {
  @Field({ nullable: true })
  id?: number;

  @Field()
  name: string;

  @Field(() => [PlaylistJSON], { nullable: true })
  listJson?: PlaylistJSON[];
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

@ObjectType('AuthRequiredResponse')
export class AuthRequiredResponse {
  @Field(() => Boolean)
  needsAuth: boolean;

  @Field(() => String)
  authUrl: string;

  @Field(() => ApiDomain)
  apiDomain: ApiDomain;
}

export const ConvertPlaylistResponse = createUnionType({
  name: 'ConvertPlaylistResponse',
  types: () => [ConvertedPlaylist, AuthRequiredResponse],
  resolveType: (value) => {
    if ('success' in value) {
      return ConvertedPlaylist;
    }
    return AuthRequiredResponse;
  },
});
