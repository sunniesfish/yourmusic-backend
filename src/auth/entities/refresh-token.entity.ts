import { Field, ID, ObjectType } from '@nestjs/graphql';
import { User } from 'src/user/entities/user.entity';
@ObjectType()
export class RefreshToken {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  refreshToken: string;
}
