import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';
@InputType()
export class UpdateUserInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  userId: string;

  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  profileImg?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsNotEmpty()
  password?: string;
}
