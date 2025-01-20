import { SetMetadata } from '@nestjs/common';
import { AuthLevel } from '../../auth/enums/auth-level.enum';

export const AUTH_LEVEL_KEY = 'authLevel';
export const Auth = (level: AuthLevel = AuthLevel.REQUIRED) =>
  SetMetadata(AUTH_LEVEL_KEY, level);

export const OAUTH_TYPE_KEY = 'oauthType';
export type OAuthType = 'spotify' | 'youtube' | null;
export const RequireOAuth = (type: OAuthType) =>
  SetMetadata(OAUTH_TYPE_KEY, type);
