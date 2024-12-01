import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './service/auth.service';
import { UserService } from 'src/user/service/user.service';
import { SignInInput } from './dto/sign-in.input';
import { SignUpInput } from './dto/sign-up.input';
import { User } from 'src/user/entities/user.entity';
import { CurrentUser } from '../global/decorators/current-user';
import { ChangePasswordInput } from './dto/change-password.input';
import { ForbiddenException } from '@nestjs/common';
import { IsPublic } from 'src/global/decorators/ispublic';
import { UserInput } from 'src/user/dto/user.input';

@Resolver()
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @IsPublic()
  @Mutation(() => User)
  async signUp(@Args('signUpInput') signUpInput: SignUpInput) {
    return await this.userService.create(signUpInput);
  }

  @IsPublic()
  @Mutation(() => User)
  async signIn(@Args('signInInput') signInInput: SignInInput) {
    return await this.authService.signIn(signInInput);
  }

  @Mutation(() => Boolean)
  async checkPassword(
    @CurrentUser() user: UserInput,
    @Args('input') input: ChangePasswordInput,
  ) {
    if (user.id !== input.id) {
      throw new ForbiddenException();
    }
    return await this.authService.checkPassword(user.id, input.password);
  }

  @Mutation(() => User)
  async changePassword(
    @CurrentUser() user: UserInput,
    @Args('input') input: ChangePasswordInput,
  ) {
    if (user.id !== input.id) {
      throw new ForbiddenException();
    }
    return await this.authService.changePassword(input);
  }
}
