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

// Throw when external api throw 401
export class OAuthenticationError extends OAuthError {
  constructor(message: string) {
    super(message, 'AUTHENTICATION_ERROR', 401);
  }
}

// Throw when external api throw 403
export class OAuthorizationError extends OAuthError {
  constructor(message: string) {
    super(message, 'AUTHORIZATION_ERROR', 403);
  }
}
