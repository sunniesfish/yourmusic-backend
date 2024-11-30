import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.get<boolean>(
      'isPublic',
      context.getHandler(),
    );
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
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
