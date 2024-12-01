import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class SaveStatisticInput {
  @Field(() => ID, { nullable: false })
  userId: string;

  @Field(() => String, { nullable: false })
  artistRankJson: string;

  @Field(() => String, { nullable: false })
  albumRankJson: string;

  @Field(() => String, { nullable: false })
  genreRankJson: string;
}
