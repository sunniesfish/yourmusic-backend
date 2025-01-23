import { SetMetadata } from '@nestjs/common';
import { AuthLevel } from '../../auth/enums/auth-level.enum';
import { ApiDomain } from 'src/auth/enums/api-domain.enum';

export const AUTH_LEVEL_KEY = 'authLevel';
export const Auth = (level: AuthLevel = AuthLevel.REQUIRED) =>
  SetMetadata(AUTH_LEVEL_KEY, level);

export const OAUTH_TYPE_KEY = 'oauthType';
export const RequireOAuth = (type: ApiDomain) =>
  SetMetadata(OAUTH_TYPE_KEY, type);
