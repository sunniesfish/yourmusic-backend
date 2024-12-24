import { Injectable } from '@nestjs/common';
import ApiRateLimiter from '@sunniesfish/api-rate-limiter';
import { GoogleAuthService } from 'src/auth/service/google-auth.service';
import { YouTubeConfig, YouTubeConfigService } from './youtubeConfig';

@Injectable()
export class YouTubeApiClient {
  private readonly apiRateLimiter: ApiRateLimiter<any>;
  private readonly config: YouTubeConfig;
  constructor(
    private readonly googleAuthService: GoogleAuthService,
    private readonly configService: YouTubeConfigService,
  ) {
    this.config = configService.getConfig();
    this.apiRateLimiter = new ApiRateLimiter({
      maxPerSecond: this.config.apiLimitPerSecond,
      maxPerMinute: this.config.apiLimitPerMinute,
      maxQueueSize: this.config.apiLimitQueueSize,
    });
  }

  async createPlaylist(userId: string, name: string): Promise<string> {
    const oauth2Client =
      await this.googleAuthService.getOAuthClientForUser(userId);

    return this.apiRateLimiter.addRequest(async () => {
      const response = await fetch(
        'https://www.googleapis.com/youtube/v3/playlists',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${oauth2Client.credentials.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ snippet: { title: name } }),
        },
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Failed to create playlist: ${errorData.error?.message || response.statusText}`,
        );
      }

      const data = await response.json();
      return data.id;
    });
  }

  async searchVideo(userId: string, query: string): Promise<string | null> {
    const oauth2Client =
      await this.googleAuthService.getOAuthClientForUser(userId);

    return this.apiRateLimiter.addRequest(async () => {
      // YouTube 검색 API 구현
      const response = await fetch(
        `${this.config.baseUrl}/search?part=snippet&q=${query}&key=${this.config.apiKey}`,
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Failed to search video: ${errorData.error?.message || response.statusText}`,
        );
      }
      const data = await response.json();
      return data.items[0]?.id?.videoId || null;
    });
  }

  async addToPlaylist(
    userId: string,
    playlistId: string,
    videoId: string,
  ): Promise<void> {
    const oauth2Client =
      await this.googleAuthService.getOAuthClientForUser(userId);

    return this.apiRateLimiter.addRequest(async () => {
      // 플레이리스트에 비디오 추가 API 구현
      const response = await fetch(
        `${this.config.baseUrl}/playlistItems?part=snippet&playlistId=${playlistId}&videoId=${videoId}&key=${this.config.apiKey}`,
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Failed to add video to playlist: ${errorData.error?.message || response.statusText}`,
        );
      }
      return;
    });
  }
}
