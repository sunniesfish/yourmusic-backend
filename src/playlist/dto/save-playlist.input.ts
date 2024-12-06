import { InputType, Field } from '@nestjs/graphql';
import { PlaylistJSON } from './playlist-json.input';

@InputType()
export class SavePlaylistInput {
  @Field()
  userId: string;

  @Field()
  name: string;

  @Field(() => [PlaylistJSON])
  listJson: PlaylistJSON[];
}
