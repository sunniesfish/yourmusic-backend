import {
  OAuth2TokenResponse,
  OAuth2AuthOptions,
  OAuth2AuthResponse,
} from '../interfaces/auth-status.interface';

export abstract class OAuth2Service {
  /**
   * OAuth2 인증 URL을 생성합니다.
   * @param options - 인증 옵션
   */
  abstract getAuthUrl(options?: OAuth2AuthOptions): string;

  /**
   * Authorization code를 사용하여 access token을 얻습니다.
   * @param authResponse - 인증 응답 (code와 state 포함)
   * @param userId - 사용자 ID
   */
  abstract getToken(
    authResponse: OAuth2AuthResponse,
    userId: string,
  ): Promise<OAuth2TokenResponse>;

  /**
   * Access token을 갱신합니다.
   */
  abstract refreshAccessToken(userId: string): Promise<OAuth2TokenResponse>;

  /**
   * 랜덤 문자열을 생성합니다 (state 파라미터용).
   */
  protected generateRandomString(length: number): string {
    const possible =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
