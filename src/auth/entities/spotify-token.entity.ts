import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType({ description: 'Spotify token information' })
export class SpotifyToken {
  @Field(() => String, {
    nullable: true,
    description: 'Token refresh token',
  })
  refreshToken: string;

  @Field(() => Date, { description: 'Creation time' })
  createdAt: Date;

  @Field(() => Date, { description: 'Last update time' })
  updatedAt: Date;
}
