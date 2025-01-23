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

  @Field(() => Date, { description: 'Token expiration time' })
  @Column({ type: 'datetime', nullable: false })
  expiresAt: Date;

  @Field(() => [String], { description: 'Approved scopes' })
  @Column({ type: 'simple-array', nullable: false })
  scopes: string[];

  @Field(() => String, {
    nullable: true,
    description: 'Token type (e.g. Bearer)',
  })
  @Column({ type: 'varchar', nullable: true })
  tokenType: string;

  @Field(() => Boolean, { description: 'Token revoked status' })
  @Column({ type: 'boolean', default: false })
  isRevoked: boolean;

  @Field(() => Date, { description: 'Creation time' })
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date, { description: 'Last update time' })
  @UpdateDateColumn()
  updatedAt: Date;
}
