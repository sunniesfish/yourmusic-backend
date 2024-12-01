import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType('PlaylistJSON')
@InputType('PlaylistJSONInput')
export class PlaylistJSON {
  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  artist?: string;

  @Field({ nullable: true })
  album?: string;

  @Field({ nullable: true })
  thumbnail?: string;
}
