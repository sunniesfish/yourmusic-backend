import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthLevel } from '../../common/enums/auth-level.enum';
import { AUTH_LEVEL_KEY } from 'src/global/decorators/auth.decorator';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    console.log('///////////////JwtAuthGuard canActivate 시작');
    // get authLevel from decorator
    // if not found, set to REQUIRED
    const authLevel =
      this.reflector.get<AuthLevel>(AUTH_LEVEL_KEY, context.getHandler()) ||
      AuthLevel.REQUIRED;
    // if authLevel is NONE, return true
    if (authLevel === AuthLevel.NONE) {
      console.log('none auth');
      return true;
    }

    try {
      const canActivate = await super.canActivate(context);
      return canActivate as boolean;
    } catch (error) {
      // if authLevel is OPTIONAL, return true
      if (authLevel === AuthLevel.OPTIONAL) {
        console.log('optional auth');
        return true;
      }
      throw error;
    }
  }

  //called after canActivate
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const authLevel =
      this.reflector.get<AuthLevel>(AUTH_LEVEL_KEY, context.getHandler()) ||
      AuthLevel.REQUIRED;

    // if authLevel is OPTIONAL and user is not found, return null
    if (authLevel === AuthLevel.OPTIONAL && !user) {
      console.log('optional but user not found');
      return null;
    }

    // if authLevel is REQUIRED and user is not found, throw error
    if (authLevel === AuthLevel.REQUIRED && !user) {
      console.log('requeired but user not found');
      throw new UnauthorizedException('User not found');
    }

    // if there is no JWT token, throw error
    if (info?.message === 'No auth token') {
      console.log('no token');
      throw new UnauthorizedException('There is no JWT token');
    }

    // if JWT token is expired, throw error
    if (info?.message === 'jwt expired') {
      console.log('jwt expired');
      throw new UnauthorizedException('JWT token expired');
    }

    // if there is an error or user is not found, throw error
    if (err || !user) {
      console.log('invalid jwt token');
      throw new UnauthorizedException('Invalid JWT token');
    }

    // if there is no error and user is found, return user
    console.log('return user', user);
    return user;
  }
}
