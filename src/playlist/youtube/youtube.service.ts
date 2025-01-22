import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { PlaylistJSON } from '../dto/playlist-json.input';
import { YouTubeConfig, YouTubeConfigService } from './youtubeConfig';
import { YouTubeApiClient } from './youtube-api.client';
import { ScraperService } from '../common/scraper.service';
import { GoogleAuthService } from '../../auth/service/google-auth.service';
import { YouTubeAuthError } from '../errors/youtube.errors';

@Injectable()
export class YouTubeService {
  private config: YouTubeConfig;

  constructor(
    @Inject(forwardRef(() => YouTubeConfigService))
    private readonly configService: YouTubeConfigService,
    @Inject()
    private readonly youtubeApiClient: YouTubeApiClient,
    @Inject()
    private readonly scraperService: ScraperService,
    @Inject()
    private readonly googleAuthService: GoogleAuthService,
  ) {
    this.config = this.configService.getConfig();
  }

  private async executeWithAuth<T>(
    userId: string | null,
    accessToken: string,
    operation: (oauth2Client: any) => Promise<T>,
  ): Promise<T> {
    try {
      const oauth2Client = await this.googleAuthService.getOAuthClient(
        userId,
        accessToken,
      );

      return await operation(oauth2Client);
    } catch (error) {
      if (error.message?.includes('invalid_token')) {
        throw new YouTubeAuthError('Invalid token');
      }
      throw new Error(`YouTube operation failed: ${error.message}`);
    }
  }

  async convertToYoutubePlaylist(
    userId: string | null,
    accessToken: string,
    playlistJSON: PlaylistJSON[],
  ): Promise<boolean> {
    try {
      const playlistId = await this.executeWithAuth(
        userId,
        accessToken,
        async (oauth2Client) => {
          return this.youtubeApiClient.createPlaylist(
            oauth2Client,
            'Converted Playlist',
          );
        },
      );

      await this.processSongsInBatches(userId, playlistId, playlistJSON);
      return true;
    } catch (error) {
      if (error instanceof YouTubeAuthError) {
        throw error;
      }
      throw new Error(`Playlist conversion failed: ${error.message}`);
    }
  }

  private async processSongsInBatches(
    userId: string,
    playlistId: string,
    songs: PlaylistJSON[],
  ): Promise<void> {
    const batchSize = this.config.batchSize;
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

      const videoId = await this.executeWithAuth(
        userId,
        async (oauth2Client) => {
          return this.youtubeApiClient.searchVideo(oauth2Client, searchQuery);
        },
      );

      if (videoId) {
        await this.executeWithAuth(userId, async (oauth2Client) => {
          return this.youtubeApiClient.addToPlaylist(
            oauth2Client,
            playlistId,
            videoId,
          );
        });
      }
    } catch (error) {
      console.error(`Failed to process song: ${song.title}`, error);
    }
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
}
