import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class SavePlaylistInput {
  @Field()
  userId: string;

  @Field()
  name: string;

  @Field()
  listJson: string;
}
