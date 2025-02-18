import { ConfigService } from '@nestjs/config';
import { SPOTIFY_OAUTH_SCOPES } from 'src/auth/common/constants/oauth-scope.constant';

export interface SpotifyAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authEndpoint: string;
  tokenEndpoint: string;
}

export function createSpotifyAuthConfig(
  configService: ConfigService,
): SpotifyAuthConfig {
  const config = {
    clientId: configService.get<string>('SPOTIFY_CLIENT_ID'),
    clientSecret: configService.get<string>('SPOTIFY_CLIENT_SECRET'),
    redirectUri: configService.get<string>('SPOTIFY_REDIRECT_URI'),
    authEndpoint: 'https://accounts.spotify.com/authorize',
    tokenEndpoint: 'https://accounts.spotify.com/api/token',
    scopes: SPOTIFY_OAUTH_SCOPES.SPOTIFY,
  };

  if (!config.clientId || !config.clientSecret || !config.redirectUri) {
    throw new Error('Missing required Spotify OAuth configuration');
  }

  return config;
}
