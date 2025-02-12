import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { AuthLevel } from '../../auth/common/enums/auth-level.enum';
import { ApiDomain } from 'src/auth/common/enums/api-domain.enum';
import { JwtAuthGuard } from 'src/auth/core/guards/jwt-auth.guard';

export const AUTH_LEVEL_KEY = 'authLevel';
export function Auth(level: AuthLevel = AuthLevel.REQUIRED) {
  return applyDecorators(
    SetMetadata(AUTH_LEVEL_KEY, level),
    UseGuards(JwtAuthGuard),
  );
}

export const OAUTH_TYPE_KEY = 'oauthType';
export const RequireOAuth = (type: ApiDomain) =>
  SetMetadata(OAUTH_TYPE_KEY, type);
