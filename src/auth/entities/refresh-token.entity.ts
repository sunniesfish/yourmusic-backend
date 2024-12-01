import { Field, ID, ObjectType } from '@nestjs/graphql';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@ObjectType()
@Entity()
export class RefreshToken {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: string;

  @Field(() => String)
  @Column({
    type: 'varchar',
    nullable: false,
    unique: true,
  })
  refreshToken: string;

  @Field(() => User)
  @OneToOne(() => User, (user) => user.id, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
