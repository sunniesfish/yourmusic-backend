export class OAuthError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number = 401,
  ) {
    super(message);
    this.name = 'OAuthError';
  }
}

export class TokenError extends OAuthError {
  constructor(message: string) {
    super(message, 'TOKEN_ERROR', 401);
  }
}

export class AuthenticationError extends OAuthError {
  constructor(message: string) {
    super(message, 'AUTHENTICATION_ERROR', 401);
  }
}

export class AuthorizationError extends OAuthError {
  constructor(message: string) {
    super(message, 'AUTHORIZATION_ERROR', 403);
  }
}
