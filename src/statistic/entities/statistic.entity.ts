import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@ObjectType()
@Entity()
export class Statistic {
  @Field(() => ID)
  @PrimaryColumn({ type: 'varchar' })
  userId: string;

  @Field()
  @Column({ type: 'text', nullable: false })
  artistRankJson: string;

  @Field()
  @Column({ type: 'text', nullable: false })
  albumRankJson: string;

  @Field()
  @Column({ type: 'text', nullable: false })
  genreRankJson: string;

  @Field()
  @UpdateDateColumn({ type: 'timestamp', nullable: false })
  updatedAt: Date;

  @Field(() => User)
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
