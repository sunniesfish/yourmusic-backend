import { Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

export class SignInInput {
  @IsNotEmpty({ message: 'ID is required' })
  @IsString()
  @Field(() => String)
  id: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @Field(() => String)
  password: string;
}
