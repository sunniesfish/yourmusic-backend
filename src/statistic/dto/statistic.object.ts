import { ObjectType, Field } from '@nestjs/graphql';
import { RankType } from './rank.type';

@ObjectType()
export class Statistic {
  @Field(() => RankType, { nullable: true })
  artistRankJson: RankType;

  @Field(() => RankType, { nullable: true })
  albumRankJson: RankType;

  @Field(() => RankType, { nullable: true })
  titleRankJson: RankType;

  @Field(() => Date, { nullable: true })
  updatedAt: Date;
}
