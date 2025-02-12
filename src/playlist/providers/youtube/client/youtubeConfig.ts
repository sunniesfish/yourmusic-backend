import { Injectable } from '@nestjs/common';
export interface YouTubeConfig {
  apiKey: string;
  baseUrl: string;
  apiLimitPerSecond: number;
  apiLimitPerMinute: number;
  apiLimitQueueSize: number;
  batchSize: number;
}

@Injectable()
export class YouTubeConfigService {
  getConfig(): YouTubeConfig {
    return youtubeConfig;
  }
}

const youtubeConfig: YouTubeConfig = {
  apiKey: process.env.YOUTUBE_API_KEY as string,
  baseUrl: 'https://www.googleapis.com/youtube/v3',
  apiLimitPerSecond:
    process.env.NODE_ENV === 'production'
      ? parseInt(process.env.YOUTUBE_API_LIMIT_PER_SECOND!)
      : 3,
  apiLimitPerMinute:
    process.env.NODE_ENV === 'production'
      ? parseInt(process.env.YOUTUBE_API_LIMIT_PER_MINUTE!)
      : 100,
  apiLimitQueueSize:
    process.env.NODE_ENV === 'production'
      ? parseInt(process.env.YOUTUBE_API_LIMIT_QUEUE_SIZE!)
      : 1000,
  batchSize:
    process.env.NODE_ENV === 'production'
      ? parseInt(process.env.YOUTUBE_BATCH_SIZE!)
      : 10,
};
