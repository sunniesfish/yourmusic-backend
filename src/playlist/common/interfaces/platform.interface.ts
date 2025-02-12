export interface PlatformResponse<T> {
  error?: {
    message: string;
    status?: number;
    code?: string;
  };
  items?: T[];
  id?: string;
}

export interface PlatformConfig {
  apiEndpoint: string;
  apiLimitPerSecond: number;
  apiLimitPerMinute: number;
  apiLimitQueueSize: number;
  batchSize?: number;
}

export interface PlatformAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}
