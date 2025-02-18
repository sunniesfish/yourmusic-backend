import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PlaylistJSON } from 'src/playlist/common/dto/playlists.dto';

@ObjectType('Playlist')
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

  @Field(() => [PlaylistJSON], { nullable: true })
  @Column({ type: 'json', nullable: false })
  listJson: PlaylistJSON[];

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true })
  thumbnail: string;

  @Field()
  @CreateDateColumn({ type: 'datetime', nullable: false })
  createdAt: Date;

  @Field(() => String, { name: 'userId' })
  @Column({ type: 'varchar', nullable: false })
  userId: string;

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  user: User;
}
