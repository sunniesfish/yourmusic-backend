import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from 'src/user/entities/user.entity';
import { RankType } from '../dto/rank.type';

@ObjectType()
export class Statistic {
  @Field()
  artistRankJson: RankType;

  @Field()
  albumRankJson: RankType;

  @Field()
  titleRankJson: RankType;

  @Field()
  updatedAt: Date;
}
