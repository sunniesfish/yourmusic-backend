import { CreateStatisticInput } from './create-statistic.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateStatisticInput extends PartialType(CreateStatisticInput) {
  @Field(() => Int)
  id: number;
}
