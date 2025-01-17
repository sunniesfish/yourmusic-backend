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
  constructor(message: string = '인증이 만료되었습니다') {
    super(message);
    this.name = 'TokenExpiredError';
  }
}

/**
 * 토큰 갱신 실패 에러
 */
export class TokenRefreshError extends YouTubeAuthError {
  constructor(message: string = '토큰 갱신에 실패했습니다') {
    super(message);
    this.name = 'TokenRefreshError';
  }
}

/**
 * 인증 필요 에러
 */
export class AuthRequiredError extends YouTubeAuthError {
  constructor(message: string = 'YouTube 인증이 필요합니다') {
    super(message);
    this.name = 'AuthRequiredError';
  }
}

/**
 * 잘못된 토큰 에러
 */
export class InvalidTokenError extends YouTubeAuthError {
  constructor(message: string = '유효하지 않은 토큰입니다') {
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
  [AUTH_ERROR_CODES.TOKEN_EXPIRED]: '인증이 만료되었습니다',
  [AUTH_ERROR_CODES.TOKEN_REFRESH_FAILED]: '토큰 갱신에 실패했습니다',
  [AUTH_ERROR_CODES.AUTH_REQUIRED]: 'YouTube 인증이 필요합니다',
  [AUTH_ERROR_CODES.INVALID_TOKEN]: '유효하지 않은 토큰입니다',
} as const;
