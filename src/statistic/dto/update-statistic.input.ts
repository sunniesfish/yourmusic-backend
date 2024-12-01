import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class UpdateStatisticInput {
  @Field(() => ID, { nullable: false })
  userId: string;

  @Field(() => String, { nullable: true })
  albumRankJson?: string;

  @Field(() => String, { nullable: true })
  genreRankJson?: string;

  @Field(() => String, { nullable: true })
  artistRankJson?: string;
}
