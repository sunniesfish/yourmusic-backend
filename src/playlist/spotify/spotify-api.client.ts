import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SpotifyConfigService } from './spotify.config';
import ApiRateLimiter from '@sunniesfish/api-rate-limiter';
import { SpotifyAuthService } from '../../auth/service/spotify-auth.service';

interface SpotifyResponse<T> {
  error?: {
    message: string;
    status: number;
  };
  items?: T[];
}

interface SpotifyPlaylistResponse {
  id: string;
  uri: string;
  name: string;
}

interface SpotifySearchResponse {
  tracks: {
    items: Array<{
      uri: string;
      name: string;
      artists: Array<{ name: string }>;
    }>;
  };
}

@Injectable()
export class SpotifyApiClient {
  private readonly apiRateLimiter: ApiRateLimiter<any>;

  constructor(
    private readonly configService: SpotifyConfigService,
    private readonly spotifyAuthService: SpotifyAuthService,
  ) {
    const config = this.configService.getConfig();
    this.apiRateLimiter = new ApiRateLimiter({
      maxPerSecond: config.apiLimitPerSecond,
      maxPerMinute: config.apiLimitPerMinute,
      maxQueueSize: config.apiLimitQueueSize,
    });
  }

  private async makeRequest<T>(
    userId: string | null,
    accessToken: string,
    url: string,
    options: RequestInit = {},
  ): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '1');
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      return this.makeRequest<T>(userId, accessToken, url, options);
    }

    if (response.status === 401) {
      if (userId) {
        const newAccessToken =
          await this.spotifyAuthService.refreshAccessToken(userId);
        return this.makeRequest<T>(
          userId,
          newAccessToken.access_token,
          url,
          options,
        );
      }
      throw new UnauthorizedException('Failed to refresh access token');
    }

    const data: SpotifyResponse<T> = await response.json();

    if (!response.ok) {
      throw new Error(
        `Spotify API Error: ${data.error?.message || response.statusText}`,
      );
    }

    return data as T;
  }

  async createPlaylist(
    userId: string | null,
    accessToken: string,
    name: string,
  ): Promise<{
    playlistId: string;
    playlistUri: string;
    playlistName: string;
  }> {
    return this.apiRateLimiter.addRequest(async () => {
      const data = await this.makeRequest<SpotifyPlaylistResponse>(
        userId,
        accessToken,
        `${this.configService.getConfig().apiEndpoint}/me/playlists`,
        {
          method: 'POST',
          body: JSON.stringify({
            name: name || 'New Playlist',
            public: true,
            description: 'Converted playlist from another platform',
          }),
        },
      );

      return {
        playlistId: data.id,
        playlistUri: data.uri,
        playlistName: data.name,
      };
    });
  }

  async searchSong(
    userId: string | null,
    accessToken: string,
    songData: { title: string; artist: string },
  ): Promise<{ songUri: string } | null> {
    return this.apiRateLimiter.addRequest(async () => {
      const query = songData.artist
        ? `track:${songData.title} artist:${songData.artist}`
        : `track:${songData.title}`;

      const data = await this.makeRequest<SpotifySearchResponse>(
        userId,
        accessToken,
        `${this.configService.getConfig().apiEndpoint}/search?q=${encodeURIComponent(
          query,
        )}&type=track&limit=1`,
      );

      return data.tracks.items[0]
        ? { songUri: data.tracks.items[0].uri }
        : null;
    });
  }

  async addSongsToPlaylist(
    userId: string | null,
    accessToken: string,
    playlistId: string,
    songUris: { songUri: string }[],
  ): Promise<void> {
    const batchSize = this.configService.getConfig().addSongBatchSize;

    for (let i = 0; i < songUris.length; i += batchSize) {
      const batch = songUris.slice(i, i + batchSize);
      await this.apiRateLimiter.addRequest(async () => {
        await this.makeRequest(
          userId,
          accessToken,
          `${this.configService.getConfig().apiEndpoint}/playlists/${playlistId}/tracks`,
          {
            method: 'POST',
            body: JSON.stringify({
              uris: batch.map((song) => song.songUri),
            }),
          },
        );
      });
    }
  }
}
