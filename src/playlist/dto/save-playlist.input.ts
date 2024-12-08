import { InputType, Field } from '@nestjs/graphql';
import { PlaylistJSON } from './playlist-json.input';

@InputType()
export class SavePlaylistInput {
  @Field()
  name: string;

  @Field(() => [PlaylistJSON])
  listJson: PlaylistJSON[];
}
