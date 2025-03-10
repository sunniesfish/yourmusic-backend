import { Injectable } from '@nestjs/common';
export interface YouTubeConfig {
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
  baseUrl: process.env.YOUTUBE_BASE_URL!,
  apiLimitPerSecond: parseInt(process.env.YOUTUBE_API_LIMIT_PER_SECOND!),
  apiLimitPerMinute: parseInt(process.env.YOUTUBE_API_LIMIT_PER_MINUTE!),
  apiLimitQueueSize: parseInt(process.env.YOUTUBE_API_LIMIT_QUEUE_SIZE!),
  batchSize: parseInt(process.env.YOUTUBE_BATCH_SIZE!),
};
