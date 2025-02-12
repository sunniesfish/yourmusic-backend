export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export class TokenError extends AuthError {
  constructor(message: string) {
    super(message, 'TOKEN_ERROR');
    this.name = 'TokenError';
  }
}

export class AuthenticationError extends AuthError {
  constructor(message: string) {
    super(message, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class OAuthError extends AuthError {
  constructor(message: string) {
    super(message, 'OAUTH_ERROR');
    this.name = 'OAuthError';
  }
}
