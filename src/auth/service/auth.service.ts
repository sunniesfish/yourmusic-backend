import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { SignInInput } from '../dto/sign-in.input';
import { User } from '../../user/entities/user.entity';
import { ChangePasswordInput } from '../dto/change-password.input';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SignUpInput } from '../dto/sign-up.input';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}
  async signIn(signInInput: SignInInput) {
    const user = await this.validateUser(signInInput.id, signInInput.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { sub: user.id, username: user.name };
    const refreshToken = this.generateRefreshToken(payload);
    await this.refreshTokenRepository.save({
      user,
      token: refreshToken,
    });
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken,
    };
  }

  async signOut(refreshToken: string) {
    const { sub } = await this.validateToken(refreshToken, false);
    const result = await this.refreshTokenRepository.delete({
      user: { id: sub },
    });
    return result.affected === 1;
  }

  async signUp(signUpInput: SignUpInput) {
    const user = await this.userRepository.findOne({
      where: { id: signUpInput.id },
    });
    if (user) {
      throw new ConflictException('User already exists');
    }
    const hashedPassword = await bcrypt.hash(signUpInput.password, 10);
    const newUser = this.userRepository.create({
      ...signUpInput,
      password: hashedPassword,
    });
    await this.userRepository.save(newUser);
    return true;
  }

  async refreshToken(refreshToken: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const refreshTokenRepository = queryRunner.manager.withRepository(
        this.refreshTokenRepository,
      );
      const userRepository = queryRunner.manager.withRepository(
        this.userRepository,
      );

      const { sub } = await this.validateToken(refreshToken, false);
      const savedRefreshToken = await refreshTokenRepository.findOne({
        where: { user: { id: sub }, refreshToken: refreshToken },
      });
      if (!savedRefreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      const user = await userRepository.findOne({ where: { id: sub } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const payload = { sub: user.id, username: user.name };
      const accessToken = this.jwtService.sign(payload);

      const newRefreshToken = this.generateRefreshToken(payload);
      await refreshTokenRepository.upsert(
        {
          user: { id: sub },
          refreshToken: newRefreshToken,
        },
        ['user'],
      );
      await queryRunner.commitTransaction();
      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async checkPassword(userId: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId, password },
    });
    return user ? true : false;
  }

  async changePassword(input: ChangePasswordInput) {
    const user = await this.userRepository.findOne({
      where: { id: input.userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.password = input.password;
    await this.userRepository.save(user);
    return true;
  }

  async validateUser(
    userId: string,
    password: string,
  ): Promise<Partial<User> | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (user && (await bcrypt.compare(password, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  validateToken(token: string, isAccessToken: boolean = true): Promise<any> {
    return this.jwtService.verifyAsync(token, {
      secret: isAccessToken
        ? this.configService.get('JWT_ACCESS_SECRET')
        : this.configService.get('JWT_REFRESH_SECRET'),
    });
  }

  generateRefreshToken(payload: any): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    } as JwtSignOptions);
  }
}
