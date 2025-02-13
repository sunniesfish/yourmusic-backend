import { Injectable } from '@nestjs/common';
import ApiRateLimiter from '@sunniesfish/api-rate-limiter';
import { GoogleAuthService } from 'src/auth/providers/google/google-auth.service';
import { YouTubeConfig, YouTubeConfigService } from './youtubeConfig';
import { OAuth2Client } from 'google-auth-library';

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

  constructor(
    private readonly googleAuthService: GoogleAuthService,
    private readonly configService: YouTubeConfigService,
  ) {
    this.config = configService.getConfig();
    this.apiRateLimiter = new ApiRateLimiter(
      {
        maxPerSecond: this.config.apiLimitPerSecond,
        maxPerMinute: this.config.apiLimitPerMinute,
        maxQueueSize: this.config.apiLimitQueueSize,
      },
      (error) => {
        console.error('YouTube API Rate Limiter Error:', error);
      },
    );
  }

  private async makeRequest<T>(
    oauth2Client: OAuth2Client,
    url: string,
    options: RequestInit = {},
  ): Promise<T> {
    try {
      console.log('=====||=====makeRequest=====||=====');
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${oauth2Client.credentials.access_token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(
          `YouTube API Error: ${responseData.error?.message || response.statusText}`,
        );
      }

      return responseData as T;
    } catch (error) {
      throw error;
    }
  }

  async createPlaylist(
    oauth2Client: OAuth2Client,
    name: string,
  ): Promise<string> {
    console.log('=====||=====createPlaylist=====||=====');
    return this.apiRateLimiter.addRequest(async () => {
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
        `${this.config.baseUrl}/search?part=snippet&type=video&maxResults=1&q=${encodedQuery}`,
      );
      console.log('searchVideo data:', data);

      return data?.items[0]?.id?.videoId || null;
    });
  }

  async addToPlaylist(
    oauth2Client: OAuth2Client,
    playlistId: string,
    videoId: string,
  ): Promise<void> {
    return this.apiRateLimiter.addRequest(async () => {
      const data = await this.makeRequest(
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
      console.log('addToPlaylist data:', data);
    });
  }
}
