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
import { RankType } from '../dto/rank.type';

@ObjectType()
@Entity()
export class Statistic {
  @Field(() => ID)
  @PrimaryColumn({ type: 'varchar' })
  userId: string;

  @Field()
  @Column({ type: 'json', nullable: false })
  artistRankJson: RankType;

  @Field()
  @Column({ type: 'json', nullable: false })
  albumRankJson: RankType;

  @Field()
  @Column({ type: 'json', nullable: false })
  titleRankJson: RankType;

  @Field()
  @UpdateDateColumn({ type: 'datetime', nullable: false })
  updatedAt: Date;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
