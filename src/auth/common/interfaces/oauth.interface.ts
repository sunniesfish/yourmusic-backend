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
