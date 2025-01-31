import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Entity, Column, PrimaryColumn } from 'typeorm';

@ObjectType()
@Entity()
export class User {
  @Field(() => ID)
  @PrimaryColumn({ unique: true, type: 'varchar', nullable: false })
  id: string;

  @Field()
  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true })
  profileImg?: string;

  @Column({ type: 'varchar', nullable: false })
  password: string;
}
