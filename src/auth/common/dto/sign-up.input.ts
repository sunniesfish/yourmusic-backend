import { Field, InputType } from '@nestjs/graphql';
import {
  IsOptional,
  IsString,
  Matches,
  Length,
  IsNotEmpty,
} from 'class-validator';
import { User } from 'src/user/dto/user.object';

@InputType()
export class SignUpInput implements User {
  @IsNotEmpty({ message: 'ID is required' })
  @IsString()
  @Length(4, 12, { message: 'ID must be between 4 and 12 characters' })
  @Matches(/^[A-Za-z0-9]+$/, {
    message: 'ID must not contain special characters',
  })
  @Field(() => String)
  userId: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @Length(8, 12, { message: 'Password must be between 8 and 12 characters' })
  @Field(() => String)
  password: string;

  @IsNotEmpty({ message: 'Name is required' })
  @IsString()
  @Length(2, 12, { message: 'Name must be between 2 and 12 characters' })
  @Field(() => String)
  name: string;

  @IsString()
  @IsOptional()
  @Field(() => String, { nullable: true })
  profileImg?: string;
}
