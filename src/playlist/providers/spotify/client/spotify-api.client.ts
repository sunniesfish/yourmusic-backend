import { BadRequestException, Injectable } from '@nestjs/common';
import { createSpotifyApiConfig } from './spotify.config';
import ApiRateLimiter from '@sunniesfish/api-rate-limiter';
import { ConfigService } from '@nestjs/config';
import { PlatformError } from 'src/playlist/common/errors/platform.errors';
import { OAuthorizationError } from 'src/auth/common/errors/oauth.errors';
import { PlaylistJSON } from 'src/playlist/common/dto/playlists.dto';
import { PlatformResponse } from 'src/playlist/common/interfaces/platform.interface';

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
  private readonly config = createSpotifyApiConfig(this.configService);

  constructor(private readonly configService: ConfigService) {
    this.apiRateLimiter = new ApiRateLimiter(
      {
        maxPerSecond: this.config.apiLimitPerSecond,
        maxPerMinute: this.config.apiLimitPerMinute,
        maxQueueSize: this.config.apiLimitQueueSize,
      },
      (error) => {
        console.log('Spotify API Rate Limiter Error:', error);
      },
    );
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
    const data: PlatformResponse<T> = await response.json();

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '1');
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      return this.makeRequest<T>(userId, accessToken, url, options);
    }
    if (response.status === 401 || response.status === 403) {
      throw new OAuthorizationError('Failed to refresh access token');
    } else if (!response.ok) {
      throw new PlatformError(
        `Spotify API Error: ${data.error?.message || response.statusText}`,
      );
    }

    if (response.status >= 400) {
      throw new PlatformError(`Spotify API Error : ${data.error.message}`);
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
        `${this.configService.get('SPOTIFY_API_ENDPOINT')}/me/playlists`,
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
        `${this.config.apiEndpoint}/search?q=${encodeURIComponent(
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
    const batchSize = this.config.addSongBatchSize;

    for (let i = 0; i < songUris.length; i += batchSize) {
      const batch = songUris.slice(i, i + batchSize);
      await this.apiRateLimiter.addRequest(async () => {
        const data = await this.makeRequest(
          userId,
          accessToken,
          `${this.config.apiEndpoint}/playlists/${playlistId}/tracks`,
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

  async searchPlaylist(playlistId: string) {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString(
      'base64',
    );

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (response.status === 404) {
      throw new Error('Playlist not found');
    }

    if (!response.ok) {
      throw new BadRequestException();
    }

    const authData = await response.json();

    return this.apiRateLimiter.addRequest(async () => {
      const data: any = await this.makeRequest(
        null,
        authData.access_token,
        `${this.config.apiEndpoint}/playlists/${playlistId}/tracks`,
      );

      const arrayData: PlaylistJSON[] = data.tracks.items.map((item) => {
        const track = item.track;
        const artists = track.artists
          .map((artist: any) => artist.name)
          .join(', ');
        return {
          title: track.name,
          artist: artists,
          album: track.album.name,
          thumbnail: track.album.images?.[0]?.url || null,
        };
      });
      return arrayData;
    });
  }
}
