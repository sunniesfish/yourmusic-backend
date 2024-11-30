import { InputType, Field, PartialType, ID } from '@nestjs/graphql';
import { SaveStatisticInput } from './save-statistic.input';

@InputType()
export class UpdateStatisticInput extends PartialType(SaveStatisticInput) {
  @Field(() => ID, { nullable: false })
  userId: string;

  @Field(() => String, { nullable: true })
  albumRankJson?: string;

  @Field(() => String, { nullable: true })
  genreRankJson?: string;

  @Field(() => String, { nullable: true })
  artistRankJson?: string;
}
