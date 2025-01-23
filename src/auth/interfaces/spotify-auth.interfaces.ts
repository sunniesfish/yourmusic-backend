export interface SpotifyUserProfile {
  id: string;
  display_name: string;
  email: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  product: string;
  type: string;
  uri: string;
}

export interface SpotifyAuthContext {
  accessToken: string;
  userId: string;
  expiresAt: Date;
}

export interface SpotifyAuthOptions {
  showDialog?: boolean;
  state?: string;
}

export interface SpotifyErrorResponse {
  error: {
    status: number;
    message: string;
  };
}
