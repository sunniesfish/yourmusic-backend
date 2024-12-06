import { Field } from '@nestjs/graphql';
import { ObjectType } from '@nestjs/graphql';
import { User } from 'src/user/entities/user.entity';

@ObjectType()
export class SignInResponse {
  @Field(() => User)
  user: User;

  @Field(() => String)
  accessToken: string;
}
