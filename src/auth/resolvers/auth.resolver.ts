import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from '../service/auth.service';
import { UserService } from 'src/user/service/user.service';
import { User } from 'src/user/entities/user.entity';
import { ForbiddenException } from '@nestjs/common';
import { UserInput } from 'src/user/dto/user.input';
import { SignInResponse } from '../dto/sign-in.response';
import { AuthLevel } from '../enums/auth-level.enum';
import { Auth } from 'src/global/decorators/auth.decorator';
import { SignUpInput } from '../dto/sign-up.input';
import { SignInInput } from '../dto/sign-in.input';
import { ChangePasswordInput } from '../dto/change-password.input';
import { CurrentUser } from 'src/global/decorators/current-user';

@Resolver()
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Auth(AuthLevel.NONE)
  @Mutation(() => Boolean)
  async signUp(@Args('signUpInput') signUpInput: SignUpInput) {
    const user = await this.userService.create(signUpInput);
    if (!user) {
      throw new Error('Failed to create user');
    }
    return true;
  }

  @Auth(AuthLevel.NONE)
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

  @Auth(AuthLevel.REQUIRED)
  @Mutation(() => Boolean)
  async signOut(@CurrentUser() user: UserInput) {
    await this.authService.signOut(user.id);
    return true;
  }

  //if id is already exist, return true, else return false
  @Auth(AuthLevel.NONE)
  @Mutation(() => Boolean)
  async checkId(@Args('id') id: string) {
    return await this.userService.checkId(id);
  }

  @Auth(AuthLevel.REQUIRED)
  @Mutation(() => Boolean)
  async checkPassword(
    @CurrentUser() user: UserInput,
    @Args('password') password: string,
  ) {
    return await this.authService.checkPassword(user.id, password);
  }

  @Auth(AuthLevel.REQUIRED)
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
