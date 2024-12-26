import { InputType, Field, ID } from '@nestjs/graphql';
import { RankInput } from './rank.input';

@InputType()
export class MutateStatisticInput {
  @Field(() => ID, { nullable: false })
  userId: string;

  @Field(() => RankInput, { nullable: false })
  artistRankJson: RankInput;

  @Field(() => RankInput, { nullable: false })
  albumRankJson: RankInput;

  @Field(() => RankInput, { nullable: false })
  titleRankJson: RankInput;
}
