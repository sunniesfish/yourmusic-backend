import { ObjectType } from '@nestjs/graphql';

import { Field } from '@nestjs/graphql';

@ObjectType('StatisticRank')
export class RankType {
  @Field(() => String, { nullable: false })
  first: string;

  @Field(() => String, { nullable: false })
  second: string;

  @Field(() => String, { nullable: false })
  third: string;
}
