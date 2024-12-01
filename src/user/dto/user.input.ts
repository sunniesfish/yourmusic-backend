import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class UserInput {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field(() => String, { nullable: true })
  name?: string;
}
