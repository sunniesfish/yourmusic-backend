import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from 'src/user/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PlaylistJSON } from '../dto/playlist-json.input';

@ObjectType()
@Entity()
export class Playlist {
  @Field(() => ID)
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'id',
    unsigned: true,
  })
  id: number;

  @Field()
  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Field(() => [PlaylistJSON])
  @Column({ type: 'json', nullable: false })
  listJson: PlaylistJSON[];

  //()=>User 타입의 엔티티를 참조하는 필드, (user) => user.id 는 User 엔티티의 id 필드를 참조하는 것을 의미
  @Field(() => User)
  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  user: User;
}
