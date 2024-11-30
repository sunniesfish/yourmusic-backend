import { InputType, Field, ID, PartialType } from '@nestjs/graphql';
import { Statistic } from '../entities/statistic.entity';

@InputType()
export class SaveStatisticInput extends PartialType(Statistic) {
  @Field(() => ID, { nullable: false })
  userId: string;

  @Field(() => String, { nullable: false })
  artistRankJson: string;

  @Field(() => String, { nullable: false })
  albumRankJson: string;

  @Field(() => String, { nullable: false })
  genreRankJson: string;
}
