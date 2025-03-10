import {
  OAuth2TokenResponse,
  OAuth2AuthResponse,
  OAuth2AuthOptions,
} from '../../common/interfaces/oauth.interface';

export abstract class OAuth2Service {
  /**
   * create oauth2 auth url
   * @param options
   */
  abstract getAuthUrl(options?: OAuth2AuthOptions): string;

  /**
   * @param authResponse - auth response (code and state included)
   * @param userId - user id
   */
  abstract getToken(
    authResponse: OAuth2AuthResponse,
    userId: string,
  ): Promise<OAuth2TokenResponse>;

  /**
   * @param userId - user id
   */
  abstract refreshAccessToken(userId: string): Promise<OAuth2TokenResponse>;

  /**
   * generate random string (for state parameter)
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

  /**
   * @param userId - user id
   */
  abstract signOut(userId: string): Promise<void>;
}
