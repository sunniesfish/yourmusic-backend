import { Injectable } from '@nestjs/common';

export interface SpotifyConfig {
  apiEndpoint: string;
  addSongBatchSize: number;
  apiLimitPerSecond: number;
  apiLimitPerMinute: number;
  apiLimitQueueSize: number;
}

@Injectable()
export class SpotifyConfigService {
  getConfig(): SpotifyConfig {
    return spotifyConfig;
  }
}

const spotifyConfig: SpotifyConfig = {
  apiEndpoint: process.env.SPOTIFY_API_ENDPOINT!,
  addSongBatchSize: parseInt(process.env.SPOTIFY_ADD_SONG_BATCH_SIZE!),
  apiLimitPerSecond:
    process.env.NODE_ENV === 'production'
      ? parseInt(process.env.SPOTIFY_API_LIMIT_PER_SECOND!)
      : 3,
  apiLimitPerMinute:
    process.env.NODE_ENV === 'production'
      ? parseInt(process.env.SPOTIFY_API_LIMIT_PER_MINUTE!)
      : 100,
  apiLimitQueueSize:
    process.env.NODE_ENV === 'production'
      ? parseInt(process.env.SPOTIFY_API_LIMIT_QUEUE_SIZE!)
      : 1000,
};
