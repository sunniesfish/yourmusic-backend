import { Field, InputType } from '@nestjs/graphql';

@InputType('StatisticRankInput')
export class RankInput {
  @Field(() => String, { nullable: false })
  first: string;

  @Field(() => String, { nullable: false })
  second: string;

  @Field(() => String, { nullable: false })
  third: string;
}
