export interface PlatformResponse<T> {
  error?: {
    message: string;
    status?: number;
    code?: string;
  };
  items?: T[];
  id?: string;
}
