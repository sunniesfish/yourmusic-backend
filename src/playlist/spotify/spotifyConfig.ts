import { Injectable } from '@nestjs/common';

export interface SpotifyConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authEndpoint: string;
  tokenEndpoint: string;
  apiEndpoint: string;
  scopes: string[];
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
  clientId: process.env.SPOTIFY_CLIENT_ID!,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI!,
  authEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
  apiEndpoint: 'https://api.spotify.com/v1',
  scopes: [
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-read-private',
    'user-read-email',
  ],
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
