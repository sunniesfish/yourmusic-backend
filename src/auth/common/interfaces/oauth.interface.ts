import { ApiDomain } from '../enums/api-domain.enum';

export interface OAuth2AuthOptions {
  showDialog?: boolean;
  state?: string;
  scope?: string | string[];
  accessType?: 'online' | 'offline';
  prompt?: string;
}

export interface OAuth2TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string[];
  issued_at?: number;
}

export interface OAuth2AuthResponse {
  code: string;
  state: string;
}

export interface OAuth2Credentials {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  userId: string;
  scopes?: string[];
  tokenType?: string;
}

export interface OAuth2UserProfile {
  id: string;
  display_name: string;
  email?: string;
  images?: Array<{
    url: string;
    height?: number;
    width?: number;
  }>;
  type: string;
  uri?: string;
}

export interface OAuth2Context {
  accessToken: string;
  userId: string;
  expiresAt: Date;
}

export interface OAuth2ErrorResponse {
  error: {
    code: string;
    message: string;
    status: number;
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
