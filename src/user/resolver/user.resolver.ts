import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserService } from '../service/user.service';
import { User } from '../entities/user.entity';
import { UpdateUserInput } from '../dto/update-user';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => User)
  async user(@Args('id', { type: () => ID }) id: string): Promise<User> {
    return await this.userService.findOne(id);
  }
  @Mutation(() => Boolean)
  async updateUser(
    @Args('updateUserInput') updateUserInput: UpdateUserInput,
  ): Promise<boolean> {
    return await this.userService.update(updateUserInput);
  }
}
