import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/user/user.module';
import { AuthService } from './service/auth.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { User } from 'src/user/entities/user.entity';
import { SpotifyToken } from './entities/spotify-token.entity';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ConfigModule } from '@nestjs/config';
import { GoogleAuthService } from './service/google-auth.service';
import { YoutubeCredentials } from './entities/youtube-token.entity';
import { SpotifyAuthService } from './service/spotify-auth.service';
import { AuthResolver } from './resolvers/auth.resolver';
import { OAuthGuard } from './guards/oauth.guard';
import { YoutubeAuthResolver } from './resolvers/youtube-auth.resolver';
import { SpotifyAuthResolver } from './resolvers/spotify-auth.resolver';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtStrategy } from './strategy/jwt.strategy';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
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
    AuthResolver,
    YoutubeAuthResolver,
    SpotifyAuthResolver,
    AuthService,
    JwtService,
    GoogleAuthService,
    SpotifyAuthService,
    JwtAuthGuard,
    OAuthGuard,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [
    AuthService,
    GoogleAuthService,
    SpotifyAuthService,
    OAuthGuard,
    JwtAuthGuard,
  ],
})
export class AuthModule {}
