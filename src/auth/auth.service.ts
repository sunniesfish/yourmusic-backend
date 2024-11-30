import { Injectable } from '@nestjs/common';

import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { SignInInput } from './dto/sign-in.input';
@Injectable()
export class AuthService {
  async signIn(signInInput: SignInInput) {
    console.log(signInInput);
    return true;
  }
  constructor(
    @InjectRepository(RefreshToken)
    private readonly tokenRepository: Repository<RefreshToken>,
  ) {}
}
