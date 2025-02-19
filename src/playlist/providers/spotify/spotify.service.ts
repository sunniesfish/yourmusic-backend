import { Injectable, Inject } from '@nestjs/common';
import { PlaylistJSON } from '../../common/dto/playlists.dto';
import { ScraperService } from '../scraper/scraper.service';
import { SpotifyApiClient } from './client/spotify-api.client';
import { ConvertedPlaylist } from '../../common/dto/playlists.dto';

@Injectable()
export class SpotifyService {
  constructor(
    @Inject()
    private readonly spotifyApiClient: SpotifyApiClient,
    @Inject()
    private readonly scraperService: ScraperService,
  ) {}

  isSpotifyUrl = (url: string): boolean => {
    return url.includes('spotify.com');
  };

  async readSpotifyPlaylist(link: string): Promise<PlaylistJSON[]> {
    console.log('//////////readSpotifyPlaylist');
    return this.scraperService.scrape(
      link,
      '[data-testid="tracklist-row"]',
      async () => {
        const trackRows = document.querySelectorAll(
          '[data-testid="tracklist-row"]',
        );
        return Array.from(trackRows).map((row) => {
          const thumbnail = row.querySelector('img')?.getAttribute('src') || '';
          const title =
            row.querySelector('.encore-text-body-medium[dir="auto"]')
              ?.textContent || '';
          const artist =
            row.querySelector('.encore-text-body-small a[href*="/artist/"]')
              ?.textContent || '';
          const album =
            row.querySelector('a[href*="/album/"]')?.textContent || '';
          return { title, artist, album, thumbnail };
        });
      },
    );
  }

  async convertToSpotifyPlaylist(
    userId: string | null,
    accessToken: string,
    playlistJSON: PlaylistJSON[],
  ): Promise<ConvertedPlaylist> {
    try {
      const playlist = await this.spotifyApiClient.createPlaylist(
        userId,
        accessToken,
        'New Playlist ' + new Date().toISOString(),
      );

      const searchResults = await Promise.allSettled(
        playlistJSON.map((song) =>
          this.spotifyApiClient.searchSong(userId, accessToken, {
            title: song.title,
            artist: song.artist,
          }),
        ),
      );

      const validSongUris = searchResults
        .filter(
          (result): result is PromiseFulfilledResult<{ songUri: string }> =>
            result.status === 'fulfilled' && result.value !== null,
        )
        .map((result) => result.value);

      await this.spotifyApiClient.addSongsToPlaylist(
        userId,
        accessToken,
        playlist.playlistId,
        validSongUris,
      );

      return {
        success: true,
        message: 'Playlist converted successfully',
        playlistId: playlist.playlistId,
        playlistName: playlist.playlistName,
        playlistUrl: playlist.playlistUri,
      };
    } catch (error) {
      throw new Error(`Failed to convert to Spotify playlist: ${error}`);
    }
  }
}
