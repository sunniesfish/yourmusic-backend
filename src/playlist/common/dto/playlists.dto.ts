import {
  ObjectType,
  Field,
  Int,
  InputType,
  createUnionType,
  ArgsType,
  ID,
} from '@nestjs/graphql';
import { ApiDomain } from 'src/auth/common/enums/api-domain.enum';

@ObjectType('Playlist')
export class Playlist {
  @Field(() => ID, { nullable: true })
  playlistId?: string;

  @Field({ nullable: true })
  name?: string;

  @Field(() => [PlaylistJSON], { nullable: true })
  listJson?: PlaylistJSON[];

  @Field({ nullable: true })
  thumbnail?: string;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field(() => String, { name: 'userId', nullable: true })
  userId?: string;
}

@ObjectType('PageInfo')
export class PageInfo {
  @Field(() => Boolean)
  hasNextPage: boolean;

  @Field(() => String, { nullable: true })
  endCursor: string | null;
}

@ObjectType('PlaylistsResponse')
export class PlaylistsResponse {
  @Field(() => [PlaylistEdge])
  edges: PlaylistEdge[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;
}

@ObjectType('PlaylistEdge')
export class PlaylistEdge {
  @Field(() => Playlist)
  node: Playlist;

  @Field(() => String)
  cursor: string;
}

/**
 * @description
 * 1. SavePlaylistInput
 */
@InputType()
export class MutatePlaylistInput {
  @Field({ nullable: true })
  playlistId?: string;

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

@ArgsType()
export class GetPlaylistsByUserArgs {
  @Field()
  userId: string;

  @Field(() => String)
  orderBy: 'createdAt' | 'name';

  @Field(() => Int)
  limit: number;

  @Field({ nullable: false })
  after: string;
}
