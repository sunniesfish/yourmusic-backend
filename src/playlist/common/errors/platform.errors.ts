export class PlatformError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'PlatformError';
  }
}

export class PlatformAuthError extends PlatformError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'PlatformAuthError';
  }
}
