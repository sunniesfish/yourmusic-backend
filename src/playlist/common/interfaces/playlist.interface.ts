// 플랫폼 공통 인터페이스
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
}
