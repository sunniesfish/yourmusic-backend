import { UserInput } from 'src/user/dto/user.input';
import { ApiDomain } from '../enums/api-domain.enum';
import { Request, Response } from 'express';

/**
 * OAuth2 토큰 응답의 기본 인터페이스
 */
export interface OAuth2TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

/**
 * OAuth2 인증 응답의 기본 인터페이스
 */
export interface OAuth2AuthResponse {
  code: string;
  state: string;
}

/**
 * OAuth2 자격증명 기본 인터페이스
 */
export interface OAuth2Credentials {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  userId: string;
}

/**
 * OAuth2 인증 옵션 기본 인터페이스
 */
export interface OAuth2AuthOptions {
  showDialog?: boolean;
  state?: string;
  scope?: string | string[];
  accessType?: 'online' | 'offline';
  prompt?: string;
}

/**
 * OAuth2 에러 응답 기본 인터페이스
 */
export interface OAuth2ErrorResponse {
  error: {
    status?: number;
    message: string;
  };
}

export interface OAuthStatus {
  isAuthenticated: boolean;
  needsReauth: boolean;
  message: string;
  accessToken?: string;
}

export interface OAuth2AccessToken {
  apiDomain: ApiDomain;
  accessToken: string;
}

// 기존 인터페이스 확장
export interface AuthRequiredError {
  needsAuth: true;
  authUrl: string;
  apiDomain: ApiDomain;
}

// GraphQL Context 타입
export interface GqlContext {
  req: Request & {
    user?: UserInput;
    api_accessToken?: string;
  };
  res: Response;
}
