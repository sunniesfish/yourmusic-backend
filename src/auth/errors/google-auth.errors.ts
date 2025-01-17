/**
 * YouTube 인증 관련 기본 에러 클래스
 */
export class YouTubeAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'YouTubeAuthError';
  }
}

/**
 * 토큰 만료 에러
 */
export class TokenExpiredError extends YouTubeAuthError {
  constructor(message: string = 'Token expired') {
    super(message);
    this.name = 'TokenExpiredError';
  }
}

/**
 * 토큰 갱신 실패 에러
 */
export class TokenRefreshError extends YouTubeAuthError {
  constructor(message: string = 'Failed to refresh token') {
    super(message);
    this.name = 'TokenRefreshError';
  }
}

/**
 * 인증 필요 에러
 */
export class AuthRequiredError extends YouTubeAuthError {
  constructor(message: string = 'YouTube authentication is required') {
    super(message);
    this.name = 'AuthRequiredError';
  }
}

/**
 * 잘못된 토큰 에러
 */
export class InvalidTokenError extends YouTubeAuthError {
  constructor(message: string = 'Invalid token') {
    super(message);
    this.name = 'InvalidTokenError';
  }
}

/**
 * 에러 코드 상수
 */
export const AUTH_ERROR_CODES = {
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_REFRESH_FAILED: 'TOKEN_REFRESH_FAILED',
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
} as const;

/**
 * 에러 메시지 상수
 */
export const AUTH_ERROR_MESSAGES = {
  [AUTH_ERROR_CODES.TOKEN_EXPIRED]: 'Token expired',
  [AUTH_ERROR_CODES.TOKEN_REFRESH_FAILED]: 'Failed to refresh token',
  [AUTH_ERROR_CODES.AUTH_REQUIRED]: 'YouTube authentication is required',
  [AUTH_ERROR_CODES.INVALID_TOKEN]: 'Invalid token',
} as const;
