import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
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
import { SignInResponse } from './dto/sign-in.response';

@Resolver()
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @IsPublic()
  @Mutation(() => Boolean)
  async signUp(@Args('signUpInput') signUpInput: SignUpInput) {
    const user = await this.userService.create(signUpInput);
    if (!user) {
      throw new Error('Failed to create user');
    }
    return true;
  }

  @IsPublic()
  @Mutation(() => SignInResponse)
  async signIn(
    @Args('signInInput') signInInput: SignInInput,
    @Context() context: any,
  ) {
    const result = await this.authService.signIn(signInInput);
    context.res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 60 * 60 * 24 * 7,
    });
    return { user: result.savedUser, accessToken: result.accessToken };
  }

  @Mutation(() => Boolean)
  async signOut(@CurrentUser() user: UserInput) {
    await this.authService.signOut(user.id);
    return true;
  }

  //if id is already exist, return true, else return false
  @IsPublic()
  @Mutation(() => Boolean)
  async checkId(@Args('id') id: string) {
    return await this.userService.checkId(id);
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
