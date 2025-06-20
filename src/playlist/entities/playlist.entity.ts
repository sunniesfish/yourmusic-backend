import { ObjectType, Field, ID } from '@nestjs/graphql';
import { PlaylistJSON } from 'src/playlist/common/dto/playlists.dto';

@ObjectType('Playlist')
export class Playlist {
  @Field(() => ID)
  id: number;

  @Field()
  name: string;

  @Field(() => [PlaylistJSON], { nullable: true })
  listJson: PlaylistJSON[];

  @Field({ nullable: true })
  thumbnail: string;

  @Field()
  createdAt: Date;

  @Field(() => String, { name: 'userId' })
  userId: string;
}
