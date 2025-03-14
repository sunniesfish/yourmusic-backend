import { ConfigService } from '@nestjs/config';

export interface SpotifyConfig {
  apiEndpoint: string;
  addSongBatchSize: number;
  apiLimitPerSecond: number;
  apiLimitPerMinute: number;
  apiLimitQueueSize: number;
}

export function createSpotifyApiConfig(
  configService: ConfigService,
): SpotifyConfig {
  const config = {
    apiEndpoint: configService.get<string>('SPOTIFY_API_ENDPOINT'),
    addSongBatchSize: parseInt(
      configService.get<string>('SPOTIFY_ADD_SONG_BATCH_SIZE'),
    ),
    apiLimitPerSecond: parseInt(
      configService.get<string>('SPOTIFY_API_LIMIT_PER_SECOND'),
    ),
    apiLimitPerMinute: parseInt(
      configService.get<string>('SPOTIFY_API_LIMIT_PER_MINUTE'),
    ),
    apiLimitQueueSize: parseInt(
      configService.get<string>('SPOTIFY_API_LIMIT_QUEUE_SIZE'),
    ),
  };

  if (
    !config.apiEndpoint ||
    !config.addSongBatchSize ||
    !config.apiLimitPerSecond ||
    !config.apiLimitPerMinute ||
    !config.apiLimitQueueSize
  ) {
    throw new Error(
      'Missing required Spotify API configuration: ' +
        (config ? JSON.stringify(config) : 'none'),
    );
  }

  return config;
}
