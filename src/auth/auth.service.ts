import { Injectable } from '@nestjs/common';

import { UnauthorizedException } from '@nestjs/common';

import { Repository } from 'typeorm';
import { TokenEntity } from './entities/token.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(TokenEntity)
    private readonly tokenRepository: Repository<TokenEntity>,
  ) {}

  async getValidToken(
    userId: string,
    service: 'spotify' | 'youtube',
  ): Promise<string> {
    const token = await this.tokenRepository.findOne({
      where: { userId, service },
    });

    if (!token) {
      throw new UnauthorizedException(`${service} 서비스 인증이 필요합니다.`);
    }

    if (this.isTokenExpired(token)) {
      return this.refreshToken(userId, service);
    }

    return token.accessToken;
  }

  private isTokenExpired(token: TokenEntity): boolean {
    return new Date() >= token.expiresAt;
  }
}
