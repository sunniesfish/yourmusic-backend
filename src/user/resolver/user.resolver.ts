import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserService } from '../service/user.service';
import { User } from '../entities/user.entity';

@Resolver()
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => [User])
  async users(): Promise<User[]> {
    return await this.userService.findAll();
  }

  @Query(() => User)
  async user(@Args('id', { type: () => ID }) id: string): Promise<User> {
    return await this.userService.findOne(id);
  }

  @Mutation(() => User)
  async createUser(@Args('user') user: User): Promise<User> {
    return await this.userService.create(user);
  }
}
