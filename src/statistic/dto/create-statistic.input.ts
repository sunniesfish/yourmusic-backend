import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateStatisticInput {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
