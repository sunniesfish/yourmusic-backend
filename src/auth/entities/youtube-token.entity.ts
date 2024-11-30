import { Field, ID, ObjectType } from '@nestjs/graphql';
import { User } from 'src/user/entities/user.entity';
import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';

@ObjectType()
@Entity()
export class YoutubeToken {
  @Field(() => ID)
  @PrimaryColumn({ type: 'varchar' })
  userId: string;

  @Field()
  @Column({ type: 'text', nullable: false })
  accessToken: string;

  @Field()
  @Column({ type: 'datetime', nullable: false })
  expiresAt: Date;

  @Field(() => User)
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
