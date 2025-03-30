import { ConfigService } from '@nestjs/config';
export interface YouTubeConfig {
  baseUrl: string;
  apiLimitPerSecond: number;
  apiLimitPerMinute: number;
  apiLimitQueueSize: number;
  batchSize: number;
}

export function createYouTubeApiConfig(
  configService: ConfigService,
): YouTubeConfig {
  const config = {
    baseUrl: configService.get<string>('YOUTUBE_BASE_URL'),
    apiLimitPerSecond: parseInt(
      configService.get<string>('YOUTUBE_API_LIMIT_PER_SECOND'),
    ),
    apiLimitPerMinute: parseInt(
      configService.get<string>('YOUTUBE_API_LIMIT_PER_MINUTE'),
    ),
    apiLimitQueueSize: parseInt(
      configService.get<string>('YOUTUBE_API_LIMIT_QUEUE_SIZE'),
    ),
    batchSize: parseInt(configService.get<string>('YOUTUBE_BATCH_SIZE')),
  };

  if (
    !config.baseUrl ||
    !config.apiLimitPerSecond ||
    !config.apiLimitPerMinute ||
    !config.apiLimitQueueSize ||
    !config.batchSize
  ) {
    throw new Error(
      'Missing required YouTube API configuration: ' + JSON.stringify(config),
    );
  }

  return config;
}
