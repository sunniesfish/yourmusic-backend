import { Field } from '@nestjs/graphql';

export class SignInInput {
  @Field(() => String)
  id: string;

  @Field(() => String)
  password: string;
}
