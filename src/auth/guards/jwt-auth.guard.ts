import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthLevel } from '../enums/auth-level.enum';
import { AUTH_LEVEL_KEY } from 'src/global/decorators/auth.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authLevel =
      this.reflector.get<AuthLevel>(AUTH_LEVEL_KEY, context.getHandler()) ||
      AuthLevel.REQUIRED;

    if (authLevel === AuthLevel.NONE) {
      return true;
    }

    try {
      const canActivate = await super.canActivate(context);
      return canActivate as boolean;
    } catch (error) {
      if (authLevel === AuthLevel.OPTIONAL) {
        return true;
      }
      throw error;
    }
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const authLevel =
      this.reflector.get<AuthLevel>(AUTH_LEVEL_KEY, context.getHandler()) ||
      AuthLevel.REQUIRED;

    if (authLevel === AuthLevel.OPTIONAL && !user) {
      return null;
    }

    if (info?.message === 'No auth token') {
      throw new UnauthorizedException('There is no JWT token');
    }
    if (info?.message === 'jwt expired') {
      throw new UnauthorizedException('JWT token expired');
    }
    if (err || !user) {
      throw new UnauthorizedException('Invalid JWT token');
    }
    return user;
  }
}
