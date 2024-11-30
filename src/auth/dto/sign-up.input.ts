import { Field } from '@nestjs/graphql';

export class SignUpInput {
  @Field(() => String)
  id: string;

  @Field(() => String)
  password: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  profileImg?: string;
}
