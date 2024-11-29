import { Injectable } from '@nestjs/common';

import { UnauthorizedException } from '@nestjs/common';

import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly tokenRepository: Repository<RefreshToken>,
  ) {}

  async getValidToken(
    userId: string,
    service: 'spotify' | 'youtube',
  ): Promise<string> {
    const token = await this.tokenRepository.findOne({
      where: { user: { id: userId }, service },
    });

    if (!token) {
      throw new UnauthorizedException(`${service} 서비스 인증이 필요합니다.`);
    }

    if (this.isTokenExpired(token)) {
      return this.refreshToken(userId, service);
    }

    return token.accessToken;
  }

  private isTokenExpired(token: RefreshToken): boolean {
    return new Date() >= token.expiresAt;
  }
}
