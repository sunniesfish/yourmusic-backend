import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType({ description: 'Spotify token information' })
@Entity()
export class SpotifyToken {
  @Field(() => ID, { description: 'User ID' })
  @PrimaryColumn({ type: 'varchar' })
  userId: string;

  @Field(() => String, {
    nullable: true,
    description: 'Token refresh token',
  })
  @Column({ type: 'text', nullable: true })
  refreshToken: string;

  @Field(() => Date, { description: 'Creation time' })
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date, { description: 'Last update time' })
  @UpdateDateColumn()
  updatedAt: Date;
}
