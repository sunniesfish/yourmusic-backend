import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { PlaylistJSON } from '../dto/playlist-json.input';
import { YouTubeConfig, YouTubeConfigService } from './youtubeConfig';
import { YouTubeApiClient } from './youtube-api.client';
import { ScraperService } from '../common/scraper.service';
import ApiRateLimiter from '@sunniesfish/api-rate-limiter';

@Injectable()
export class YouTubeService {
  private config: YouTubeConfig;
  private apiRateLimiter: ApiRateLimiter<any>;
  constructor(
    @Inject(forwardRef(() => YouTubeConfigService))
    private readonly configService: YouTubeConfigService,
    @Inject()
    private readonly youtubeApiClient: YouTubeApiClient,
    @Inject()
    private readonly scraperService: ScraperService,
  ) {
    this.config = this.configService.getConfig();
    this.apiRateLimiter = new ApiRateLimiter(
      {
        maxPerSecond: this.config.apiLimitPerSecond,
        maxPerMinute: this.config.apiLimitPerMinute,
        maxQueueSize: this.config.apiLimitQueueSize,
      },
      (error) => {
        console.error('api error', error);
        throw new Error('api error');
      },
    );
  }

  isYoutubeUrl(link: string) {
    return link.includes('youtube.com') || link.includes('youtu.be');
  }

  readYoutubePlaylist(link: string): Promise<PlaylistJSON[]> {
    return this.scraperService.scrape(link, 'div.contentSpacing', async () => {
      const trackRows = document.querySelectorAll(
        '[data-testid="tracklist-row"]',
      );
      return Array.from(trackRows).map((row) => {
        const thumbnail = row.querySelector('img')?.getAttribute('src') || '';
        const title = row.querySelector('a')?.getAttribute('title') || '';
        const artist = row.querySelector('a')?.getAttribute('title') || '';
        return { title, artist, thumbnail };
      });
    });
  }

  async convertToYoutubePlaylist(
    userId: string,
    playlistJSON: PlaylistJSON[],
  ): Promise<boolean> {
    try {
      // 1. 플레이리스트 생성
      const playlistId = await this.youtubeApiClient.createPlaylist(
        userId,
        'Converted Playlist',
      );

      // 2. 곡 검색 및 추가 (배치 처리)
      await this.processSongsInBatches(userId, playlistId, playlistJSON);

      return true;
    } catch (error) {
      throw new Error(`Failed to convert to YouTube playlist: ${error}`);
    }
  }

  private async processSongsInBatches(
    userId: string,
    playlistId: string,
    songs: PlaylistJSON[],
  ): Promise<void> {
    // 배치 크기 설정
    const batchSize = this.config.batchSize;

    // 곡들을 배치로 나누어 처리
    for (let i = 0; i < songs.length; i += batchSize) {
      const batch = songs.slice(i, i + batchSize);
      await Promise.all(
        batch.map((song) => this.processOneSong(userId, playlistId, song)),
      );
    }
  }

  private async processOneSong(
    userId: string,
    playlistId: string,
    song: PlaylistJSON,
  ): Promise<void> {
    try {
      const searchQuery = `${song.title} ${song.artist}`;
      const videoId = await this.youtubeApiClient.searchVideo(
        userId,
        searchQuery,
      );

      if (videoId) {
        await this.youtubeApiClient.addToPlaylist(userId, playlistId, videoId);
      }
    } catch (error) {
      // 개별 곡 처리 실패 로깅
      console.error(`Failed to process song: ${song.title}`, error);
    }
  }
}
