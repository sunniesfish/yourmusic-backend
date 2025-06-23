import { Field } from '@nestjs/graphql';
import { ObjectType } from '@nestjs/graphql';
import { User } from 'src/user/dto/user.object';

@ObjectType()
export class SignInResponse {
  @Field(() => User)
  user: User;

  @Field(() => String)
  accessToken: string;
}
