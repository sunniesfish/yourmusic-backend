import { Injectable } from '@nestjs/common';
import ApiRateLimiter from '@sunniesfish/api-rate-limiter';
import { YouTubeConfig, YouTubeConfigService } from './youtubeConfig';
import { OAuth2Client } from 'google-auth-library';
import { PlatformError } from 'src/playlist/common/errors/platform.errors';
import { OAuthenticationError } from 'src/auth/common/errors/oauth.errors';
import { PlatformResponse } from 'src/playlist/common/interfaces/platform.interface';

interface YouTubePlaylistResponse {
  id: string;
  snippet: {
    title: string;
  };
}

interface YouTubeSearchResponse {
  items: Array<{
    id: {
      videoId: string;
    };
    snippet: {
      title: string;
    };
  }>;
}

@Injectable()
export class YouTubeApiClient {
  private readonly apiRateLimiter: ApiRateLimiter<any>;
  private readonly config: YouTubeConfig;

  constructor(private readonly configService: YouTubeConfigService) {
    this.config = configService.getConfig();
    this.apiRateLimiter = new ApiRateLimiter(
      {
        maxPerSecond: this.config.apiLimitPerSecond,
        maxPerMinute: this.config.apiLimitPerMinute,
        maxQueueSize: this.config.apiLimitQueueSize,
      },
      (error) => {
        throw new PlatformError('Error in apiRateLimiter', error as string);
      },
    );
  }

  private async makeRequest<T>(
    oauth2Client: OAuth2Client,
    url: string,
    options: RequestInit = {},
  ): Promise<T> {
    console.log('--- youtube api client makeRequest ---');
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${oauth2Client.credentials.access_token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    console.log('--- youtube api client makeRequest ---', response);
    const data: PlatformResponse<T> = await response.json();
    if (response.status === 401 || response.status === 403) {
      throw new OAuthenticationError(
        `YouTube API Authentication Error: ${data.error.message}`,
      );
    }

    if (response.status === 429 || response.status === 409) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '1');
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      return this.makeRequest<T>(oauth2Client, url, options);
    }

    if (response.status >= 400) {
      throw new PlatformError(`YouTube API Error: ${data.error.message}`);
    }

    return data as T;
  }

  async createPlaylist(
    oauth2Client: OAuth2Client,
    name: string,
  ): Promise<string> {
    console.log('--- youtube api client createPlaylist ---');
    return this.apiRateLimiter.addRequest(async () => {
      console.log('--- youtube api client createPlaylist ---', oauth2Client);
      const data = await this.makeRequest<YouTubePlaylistResponse>(
        oauth2Client,
        `${this.config.baseUrl}/playlists?part=snippet`,
        {
          method: 'POST',
          body: JSON.stringify({
            snippet: {
              title: name,
              description: 'Converted playlist from another platform',
            },
          }),
        },
      );
      console.log('--- youtube api client createPlaylist ---', data);
      return data.id;
    });
  }

  async searchVideo(
    oauth2Client: OAuth2Client,
    query: string,
  ): Promise<string | null> {
    return this.apiRateLimiter.addRequest(async () => {
      const encodedQuery = encodeURIComponent(query);
      const data = await this.makeRequest<YouTubeSearchResponse>(
        oauth2Client,
        `${this.config.baseUrl}/search?part=snippet&type=video&maxResults=1&q=${encodedQuery}&fields=items(id/videoId)`,
      );

      return data?.items[0]?.id?.videoId || null;
    });
  }

  async addToPlaylist(
    oauth2Client: OAuth2Client,
    playlistId: string,
    videoId: string,
  ): Promise<void> {
    return this.apiRateLimiter.addRequest(async () => {
      await this.makeRequest(
        oauth2Client,
        `${this.config.baseUrl}/playlistItems?part=snippet`,
        {
          method: 'POST',
          body: JSON.stringify({
            snippet: {
              playlistId,
              resourceId: {
                kind: 'youtube#video',
                videoId,
              },
            },
          }),
        },
      );
    });
  }
}
