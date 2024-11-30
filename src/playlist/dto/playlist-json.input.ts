import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType('PlaylistJSON')
@InputType('PlaylistJSONInput')
export class PlaylistJSON {
  @Field()
  title?: string;

  @Field()
  artist?: string;

  @Field()
  album?: string;

  @Field()
  thumbnail?: string;
}
