import { IsNotEmpty, IsString } from 'class-validator';
import { Field, ID, InputType } from '@nestjs/graphql';
@InputType()
export class ChangePasswordInput {
  @IsString()
  @IsNotEmpty()
  @Field(() => ID)
  id: string;

  @IsString()
  @IsNotEmpty()
  @Field(() => String)
  password: string;
}
