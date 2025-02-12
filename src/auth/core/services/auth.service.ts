import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from '../../entities/refresh-token.entity';
import { SignInInput } from '../../common/dto/sign-in.input';
import { User } from '../../../user/entities/user.entity';
import { ChangePasswordInput } from '../../common/dto/change-password.input';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SignUpInput } from '../../common/dto/sign-up.input';
import { UserService } from '../../../user/service/user.service';

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
    private readonly userService: UserService,
  ) {}

  generateRefreshToken(payload: any): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });
  }

  async signIn(signInInput: SignInInput) {
    const user = await this.validateUser(signInInput.id, signInInput.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const payload = { sub: user.id, username: user.name };
      const refreshToken = this.generateRefreshToken(payload);
      const refreshTokenRepository = queryRunner.manager.withRepository(
        this.refreshTokenRepository,
      );

      await refreshTokenRepository.delete({ user: { id: user.id } });
      await refreshTokenRepository.save({
        user: { id: user.id },
        refreshToken: refreshToken,
      });

      await queryRunner.commitTransaction();

      return {
        user,
        accessToken: this.jwtService.sign(payload, {
          secret: this.configService.get('JWT_ACCESS_SECRET'),
        }),
        refreshToken,
      };
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      if (!queryRunner.isReleased) {
        await queryRunner.release();
      }
    }
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
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return await bcrypt.compare(password, user.password);
  }

  async changePassword(input: ChangePasswordInput) {
    const user = await this.userRepository.findOne({
      where: { id: input.id },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.password = input.password;
    await this.userRepository.save(user);
    return true;
  }

  async validateUser(id: string, password: string): Promise<any> {
    const isValid = await this.userService.validateUser(id, password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const user = await this.userService.findOne(id, ['id', 'name']);

    return user;
  }

  validateToken(token: string, isAccessToken: boolean = true): Promise<any> {
    return this.jwtService.verifyAsync(token, {
      secret: isAccessToken
        ? this.configService.get('JWT_ACCESS_SECRET')
        : this.configService.get('JWT_REFRESH_SECRET'),
    });
  }
}
