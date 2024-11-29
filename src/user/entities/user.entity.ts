import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Entity, Column, PrimaryColumn } from 'typeorm';

@ObjectType() // GraphQL을 위한 데코레이터
@Entity() // TypeORM을 위한 데코레이터
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

  // GraphQL에서 노출하지 않을 필드
  @Column({ type: 'varchar', nullable: false })
  password: string;
}
