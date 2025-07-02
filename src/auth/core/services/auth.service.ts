import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { SignInInput } from '../../common/dto/sign-in.input';
import { User } from '../../../user/dto/user.object';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SignUpInput } from '../../common/dto/sign-up.input';
import { UserService } from '../../../user/services/user.service';
import { UpdateUserInput } from 'src/user/dto/update-user.input';
import { Firestore } from '@google-cloud/firestore';
import { UserDocument } from 'src/firestore/interfaces/user.interface';
@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS: number;
  private readonly REFRESH_TOKEN_EXPIRATION: string;
  constructor(
    private readonly configService: ConfigService,
    @Inject('FIRESTORE')
    private readonly firestore: Firestore,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {
    this.SALT_ROUNDS = parseInt(this.configService.get('SALT_ROUNDS'));
    this.REFRESH_TOKEN_EXPIRATION = this.configService.get(
      'REFRESH_TOKEN_EXPIRATION',
    );
  }

  generateRefreshToken(payload: any): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.REFRESH_TOKEN_EXPIRATION,
    });
  }

  async signIn(signInInput: SignInInput): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
  }> {
    const result = await this.firestore.runTransaction(async (tx) => {
      const user = await this.userService.validateUser(
        signInInput.userId,
        signInInput.password,
        tx,
      );

      const payload = {
        sub: user.userId,
        username: user.name,
      };
      const refreshToken = this.generateRefreshToken(payload);
      const accessToken = this.jwtService.sign(payload, {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
      });

      const isUpdated = await this.userService.update(
        {
          userId: signInInput.userId,
          refreshToken: {
            id: signInInput.userId,
            refreshToken: refreshToken,
          },
        },
        tx,
      );

      if (!isUpdated) {
        throw new UnauthorizedException('Invalid credentials');
      }

      return {
        user: {
          userId: user.userId,
          name: user.name,
        },
        accessToken,
        refreshToken,
      };
    });
    return result;
  }

  async signOut(refreshToken: string) {
    const { sub: userId } = await this.validateToken(refreshToken, false);
    const result = await this.userService.update({
      userId: userId,
      refreshToken: {
        id: userId,
        refreshToken: null,
      },
    });
    return result;
  }

  async signUp(signUpInput: SignUpInput): Promise<boolean> {
    const result = await this.userService.create(signUpInput);
    return !!result;
  }

  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const { sub: userId } = await this.validateToken(refreshToken, false);
    const result = await this.firestore.runTransaction(async (tx) => {
      let userDoc: Partial<UserDocument>;
      try {
        userDoc = await this.userService.findOne(
          userId,
          ['refreshToken', 'userId', 'name'],
          tx,
        );
      } catch (error) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const payload = { sub: userDoc.userId, username: userDoc.name };
      const accessToken = this.jwtService.sign(payload, {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
      });

      const newRefreshToken = this.generateRefreshToken(payload);

      const isUpdated = await this.userService.update(
        {
          userId: userId,
          refreshToken: {
            id: userId,
            refreshToken: newRefreshToken,
          },
        },
        tx,
      );

      if (!isUpdated) {
        throw new InternalServerErrorException(
          'Failed to update refresh token',
        );
      }

      return { accessToken, refreshToken: newRefreshToken };
    });
    return result;
  }

  async checkPassword(userId: string, password: string): Promise<boolean> {
    const user = await this.userService.findOne(userId, ['password']);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return await bcrypt.compare(password, user.password);
  }

  async changePassword(input: UpdateUserInput): Promise<boolean> {
    const hashedPassword = await bcrypt.hash(input.password, this.SALT_ROUNDS);
    await this.firestore.runTransaction(async (tx) => {
      const user = await this.userService.findOne(
        input.userId,
        ['password'],
        tx,
      );
      if (!user) {
        throw new NotFoundException('User not found');
      }
      user.password = hashedPassword;
      await this.userService.update(
        {
          userId: input.userId,
          password: hashedPassword,
        },
        tx,
      );
    });
    return true;
  }

  validateToken(token: string, isAccessToken: boolean = true): Promise<any> {
    return this.jwtService.verifyAsync(token, {
      secret: isAccessToken
        ? this.configService.get('JWT_ACCESS_SECRET')
        : this.configService.get('JWT_REFRESH_SECRET'),
    });
  }
}
