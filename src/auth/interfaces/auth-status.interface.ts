/**
 * YouTube OAuth 인증 상태를 나타내는 인터페이스
 */
export interface AuthStatus {
  /** 현재 인증 여부 */
  isAuthenticated: boolean;
  /** 재인증 필요 여부 */
  needsReauth: boolean;
  /** 상태 메시지 */
  message?: string;
}

/**
 * YouTube OAuth 토큰 정보 인터페이스
 */
export interface OAuthTokens {
  /** 액세스 토큰 */
  access_token: string;
  /** 리프레시 토큰 */
  refresh_token?: string;
  /** 토큰 만료 시간 */
  expiry_date: number;
}
