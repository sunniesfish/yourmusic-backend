import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class SignInInput {
  @IsNotEmpty({ message: 'ID is required' })
  @IsString()
  @Field(() => String)
  userId: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @Field(() => String)
  password: string;
}
