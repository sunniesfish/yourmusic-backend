import { Args, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/service/user.service';
import { SignInInput } from './dto/sign-in.input';
import { SignUpInput } from './dto/sign-up.input';

@Resolver()
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  async signUp(@Args('signUpInput') signUpInput: SignUpInput) {
    return await this.userService.create(signUpInput);
  }

  async signIn(@Args('signInInput') signInInput: SignInInput) {
    return await this.authService.signIn(signInInput);
  }
}
