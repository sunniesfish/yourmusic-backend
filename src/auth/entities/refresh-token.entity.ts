import { Field, ID, ObjectType } from '@nestjs/graphql';
import { User } from 'src/user/entities/user.entity';
import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType()
@Entity()
export class RefreshToken {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: string;

  @Field()
  @Column({
    type: 'varchar',
    nullable: false,
    unique: true,
  })
  refreshToken: string;

  @Field(() => User)
  @OneToOne(() => User, (user) => user.id, { eager: true })
  user: User;
}
