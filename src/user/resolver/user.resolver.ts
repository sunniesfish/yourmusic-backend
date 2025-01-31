import { Args, Info, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserService } from '../service/user.service';
import { User } from '../entities/user.entity';
import { UpdateUserInput } from '../dto/update-user.input';
import { FieldNode, GraphQLResolveInfo } from 'graphql';
import { EXCLUDED_USER_FIELDS } from '../constants/field-restrictions';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { CurrentUser } from 'src/global/decorators/current-user';
import { UserInput } from '../dto/user.input';
import { Auth } from 'src/global/decorators/auth.decorator';
import { AuthLevel } from 'src/auth/enums/auth-level.enum';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Auth(AuthLevel.REQUIRED)
  @Query(() => User)
  async user(
    @Info() info: GraphQLResolveInfo,
    @CurrentUser() user: UserInput,
  ): Promise<User> {
    if (!user.id) {
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

    const foundUser = await this.userService.findOne(
      user.id,
      Object.keys(requestedFields) as Array<keyof User>,
    );

    if (!foundUser) {
      throw new UnauthorizedException('User not found');
    }

    return foundUser;
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
