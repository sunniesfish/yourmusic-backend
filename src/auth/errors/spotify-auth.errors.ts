export class SpotifyAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SpotifyAuthError';
  }
}

export class TokenRefreshError extends SpotifyAuthError {
  constructor(message: string) {
    super(`Failed to refresh token: ${message}`);
    this.name = 'TokenRefreshError';
  }
}

export class TokenValidationError extends SpotifyAuthError {
  constructor(message: string) {
    super(`Failed to validate token: ${message}`);
    this.name = 'TokenValidationError';
  }
}

export class AuthorizationError extends SpotifyAuthError {
  constructor(message: string) {
    super(`Failed to authorize: ${message}`);
    this.name = 'AuthorizationError';
  }
}
