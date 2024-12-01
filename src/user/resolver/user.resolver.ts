import { Args, ID, Info, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserService } from '../service/user.service';
import { User } from '../entities/user.entity';
import { UpdateUserInput } from '../dto/update-user.input';
import { FieldNode, GraphQLResolveInfo } from 'graphql';
import { EXCLUDED_USER_FIELDS } from '../constants/field-restrictions';
import { ForbiddenException } from '@nestjs/common';
import { CurrentUser } from 'src/global/decorators/current-user';
import { UserInput } from '../dto/user.input';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => User)
  async user(
    @Args('id', { type: () => ID }) id: string,
    @Info() info: GraphQLResolveInfo,
    @CurrentUser() user: UserInput,
  ): Promise<User> {
    if (user.id !== id) {
      throw new ForbiddenException();
    }

    const selections = info.fieldNodes[0].selectionSet.selections;
    const requestedFields = selections
      .filter(
        (selection): selection is FieldNode =>
          selection.kind === 'Field' &&
          !EXCLUDED_USER_FIELDS.includes(selection.name.value as any),
      )
      .reduce(
        (acc, field) => ({
          ...acc,
          [field.name.value]: true,
        }),
        {},
      );

    return await this.userService.findOne(
      id,
      Object.keys(requestedFields) as Array<keyof User>,
    );
  }

  @Mutation(() => Boolean)
  async updateUser(
    @Args('updateUserInput') updateUserInput: UpdateUserInput,
    @CurrentUser() user: UserInput,
  ): Promise<boolean> {
    if (user.id !== updateUserInput.id) {
      throw new ForbiddenException();
    }

    return await this.userService.update(updateUserInput);
  }
}
