import { Field, ID, ObjectType } from '@nestjs/graphql';
import { User } from 'src/user/entities/user.entity';
import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';

@ObjectType()
@Entity()
export class YoutubeCredentials {
  @Field(() => ID)
  @PrimaryColumn({ type: 'varchar' })
  userId: string;

  @Field()
  @Column({ type: 'text', nullable: true })
  refreshToken: string;

  @Field()
  @Column({ type: 'text', nullable: true })
  scope: string;

  @Field()
  @Column({ type: 'text', nullable: true })
  tokenType: string;

  @Field()
  @Column({ type: 'bigint', nullable: true })
  expiryDate: number;

  @Field(() => User)
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
