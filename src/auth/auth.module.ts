import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/user/user.module';
import { AuthService } from './service/auth.service';
import { AuthResolver } from './auth.resolver';
import { RefreshToken } from './entities/refresh-token.entity';
import { User } from 'src/user/entities/user.entity';
import { SpotifyToken } from './entities/spotify-token.entity';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ConfigModule } from '@nestjs/config';
import { GoogleAuthService } from './service/google-auth.service';
import { YoutubeCredentials } from './entities/youtube-token.entity';
import { YouTubeAuthInterceptor } from './intercepter/youtube-auth.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: '30m' },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      RefreshToken,
      User,
      YoutubeCredentials,
      SpotifyToken,
    ]),
    UserModule,
  ],
  providers: [
    AuthService,
    AuthResolver,
    JwtService,
    GoogleAuthService,
    {
      provide: APP_INTERCEPTOR,
      useClass: YouTubeAuthInterceptor,
    },
  ],
  exports: [AuthService, GoogleAuthService],
})
export class AuthModule {}
