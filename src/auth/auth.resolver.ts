import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './service/auth.service';
import { UserService } from 'src/user/service/user.service';
import { SignInInput } from './dto/sign-in.input';
import { SignUpInput } from './dto/sign-up.input';
import { User } from 'src/user/entities/user.entity';
import { CurrentUser } from '../global/decorators/current-user';
import { ChangePasswordInput } from './dto/change-password.input';

@Resolver()
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Mutation(() => User)
  async signUp(@Args('signUpInput') signUpInput: SignUpInput) {
    return await this.userService.create(signUpInput);
  }

  @Mutation(() => User)
  async signIn(@Args('signInInput') signInInput: SignInInput) {
    return await this.authService.signIn(signInInput);
  }

  @Mutation(() => Boolean)
  async checkPassword(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('password') password: string,
  ) {
    return await this.authService.checkPassword(userId, password);
  }

  @Mutation(() => User)
  async changePassword(
    @CurrentUser() user: User,
    @Args('input') input: ChangePasswordInput,
  ) {
    return await this.authService.changePassword(input);
  }
}
