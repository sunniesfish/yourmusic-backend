import { forwardRef, Inject, Injectable } from '@nestjs/common';
import {
  ConvertedPlaylist,
  PlaylistJSON,
} from '../../common/dto/playlists.dto';
import { ScraperService } from '../scraper/scraper.service';
import { GoogleAuthService } from 'src/auth/providers/google/google-auth.service';
import { YouTubeConfigService } from './client/youtubeConfig';
import { YouTubeConfig } from './client/youtubeConfig';
import { YouTubeApiClient } from './client/youtube-api.client';
import { OAuthenticationError } from 'src/auth/common/errors/oauth.errors';
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
      console.log('=== Auth Debug Info ===');
      console.log('userId:', userId);
      console.log('accessToken:', accessToken?.substring(0, 10) + '...');

      const oauth2Client = await this.googleAuthService.getOAuthClient(
        userId,
        accessToken,
        null,
      );

      return await operation(oauth2Client);
    } catch (error) {
      throw error;
    }
  }

  async convertToYoutubePlaylist(
    userId: string | null,
    accessToken: string,
    playlistJSON: PlaylistJSON[],
  ): Promise<ConvertedPlaylist> {
    try {
      const playlistId = await this.executeWithAuth(
        userId,
        accessToken,
        async (oauth2Client) => {
          return this.youtubeApiClient.createPlaylist(
            oauth2Client,
            'New Playlist ' + new Date().toISOString(),
          );
        },
      );
      console.log('=====||=====playlistId=====||=====');
      console.log(playlistId);

      await this.processSongsInBatches(
        userId,
        playlistId,
        playlistJSON,
        accessToken,
      );
      return {
        success: true,
        message: 'Playlist converted successfully',
        playlistId: playlistId,
        playlistName: playlistJSON[0].title,
        playlistUrl: `https://www.youtube.com/playlist?list=${playlistId}`,
      };
    } catch (error) {
      if (error) {
        throw error;
      }
    }
  }

  private async processSongsInBatches(
    userId: string,
    playlistId: string,
    songs: PlaylistJSON[],
    accessToken: string,
  ): Promise<void> {
    console.log('=====||=====processSongsInBatches=====||=====');
    const batchSize = this.config.batchSize;
    for (let i = 0; i < songs.length; i += batchSize) {
      const batch = songs.slice(i, i + batchSize);
      await Promise.all(
        batch.map((song) =>
          this.processOneSong(userId, playlistId, song, accessToken),
        ),
      );
    }
  }

  private async processOneSong(
    userId: string,
    playlistId: string,
    song: PlaylistJSON,
    accessToken: string,
  ): Promise<void> {
    console.log('=========processOneSong=========');
    try {
      const searchQuery = `${song.title} ${song.artist}`;

      const videoId = await this.executeWithAuth(
        userId,
        accessToken,
        async (oauth2Client) => {
          return this.youtubeApiClient.searchVideo(oauth2Client, searchQuery);
        },
      );
      console.log('videoId:', videoId);
      if (videoId) {
        await this.executeWithAuth(
          userId,
          accessToken,
          async (oauth2Client) => {
            return this.youtubeApiClient.addToPlaylist(
              oauth2Client,
              playlistId,
              videoId,
            );
          },
        );
      }
    } catch (error) {
      console.error(`Failed to process song: ${song.title}`, error);
    }
  }

  isYoutubeUrl(link: string) {
    return link.includes('youtube.com') || link.includes('youtu.be');
  }

  async readYoutubePlaylist(link: string): Promise<PlaylistJSON[]> {
    console.log('//////////readYoutubePlaylist');
    return this.scraperService.scrape(
      link,
      'ytd-playlist-video-renderer',
      async () => {
        const trackRows = document.querySelectorAll(
          'ytd-playlist-video-renderer',
        );
        return Array.from(trackRows).map((row) => {
          const titleElement = row.querySelector('#video-title');
          const title = titleElement?.textContent?.trim() || '';

          const channelElement = row.querySelector(
            'ytd-channel-name yt-formatted-string a',
          );
          const artist = channelElement?.textContent?.trim() || '';
          return {
            title: title ? title : 'no title',
            artist: artist ? artist : 'no artist',
          };
        });
      },
    );
  }
}
