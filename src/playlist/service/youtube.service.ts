import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { scraper } from '../util/scraper';
import { PlaylistJSON } from '../dto/playlist-json.input';
import { YouTubeConfig, YoutubeConfigService } from '../config/youtubeConfig';
import ApiRateLimiter from '@sunniesfish/api-rate-limiter';

@Injectable()
export class YoutubeService {
  private config: YouTubeConfig;
  constructor(
    @Inject(forwardRef(() => YoutubeConfigService))
    private configService: YoutubeConfigService,
    private apiRateLimiter: ApiRateLimiter<any>,
  ) {
    this.config = configService.getConfig();
    this.apiRateLimiter = new ApiRateLimiter({
      maxPerSecond: this.config.apiLimitPerSecond,
      maxPerMinute: this.config.apiLimitPerMinute,
      maxQueueSize: this.config.apiLimitQueueSize,
    });
  }

  readYoutubePlaylist = async (link: string): Promise<PlaylistJSON[]> => {
    return scraper(link, 'ytd-playlist-video-renderer', async () => {
      const trackRows = document.querySelectorAll(
        'ytd-playlist-video-renderer',
      );
      return Array.from(trackRows).map((row) => {
        // 비디오 제목 추출
        const titleElement = row.querySelector('#video-title');
        const title = titleElement?.textContent?.trim() || '';

        // 채널명 추출
        const channelElement = row.querySelector(
          'ytd-channel-name yt-formatted-string a',
        );
        const artist = channelElement?.textContent?.trim() || '';

        return {
          title,
          artist,
        };
      });
    });
  };

  isYoutubeUrl = (url: string): boolean => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  // async convertToYoutubePlaylist(playlistJSON: PlaylistJSON[]) {
  //   try {
  //     const playlist: {
  //       playlistName: string;
  //       playlistId: string;
  //       playlistUri: string;
  //     } = await this.apiRateLimiter.addRequest(async () => {
  //       return await this.createPlaylist();
  //     });

  //     const searchSongRequests = await Promise.allSettled(
  //       playlistJSON.map(
  //         (song) =>
  //           new Promise<{ songUri: string } | null>(async (resolve) => {
  //             this.apiRateLimiter.addRequest(async () => {
  //               const result = await this.searchSong();
  //               resolve(result);
  //             });
  //           }),
  //       ),
  //     );
  //   } catch (error) {
  //     console.error(error);
  //     throw error;
  //   }
  // }

  async createPlaylist() {
    return true;
  }

  async searchSong() {
    return true;
  }
}
