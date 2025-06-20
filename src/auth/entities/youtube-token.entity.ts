import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class YoutubeCredentials {
  @Field()
  refreshToken: string;

  @Field()
  scope: string;

  @Field()
  tokenType: string;

  @Field()
  expiryDate: number;
}
