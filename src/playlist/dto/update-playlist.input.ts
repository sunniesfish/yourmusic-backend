import { CreatePlaylistInput } from './create-playlist.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdatePlaylistInput extends PartialType(CreatePlaylistInput) {
  @Field(() => Int)
  id: number;
}
