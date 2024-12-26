export interface SpotifyAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authEndpoint: string;
  tokenEndpoint: string;
  scopes: string[];
}

const spotifyAuthConfig: SpotifyAuthConfig = {
  clientId: process.env.SPOTIFY_CLIENT_ID!,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI!,
  authEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
  scopes: [
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-read-private',
    'user-read-email',
  ],
};

export const spotifyAuthConfigService = {
  getConfig: () => spotifyAuthConfig,
};
