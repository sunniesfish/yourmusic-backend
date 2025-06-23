import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class User {
  @Field(() => ID)
  userId: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  profileImg?: string;
}
