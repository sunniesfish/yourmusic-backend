import { ObjectType } from '@nestjs/graphql';

import { Field } from '@nestjs/graphql';

// Object 타입 정의
@ObjectType('StatisticRank')
export class RankType {
  @Field(() => String, { nullable: false })
  first: string;

  @Field(() => String, { nullable: false })
  second: string;

  @Field(() => String, { nullable: false })
  third: string;
}
