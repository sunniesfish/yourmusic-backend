import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { scraper } from '../util/scraper';
import { SpotifyConfig, SpotifyConfigService } from '../config/spotifyConfig';
import { PlaylistJSON } from '../dto/playlist-json.input';

@Injectable()
export class SpotifyService {
  private config: SpotifyConfig;
  constructor(
    @Inject(forwardRef(() => SpotifyConfigService))
    private configService: SpotifyConfigService,
  ) {
    this.config = configService.getConfig();
  }

  readSpotifyPlaylist = async (link: string): Promise<PlaylistJSON[]> => {
    return scraper(link, 'div.contentSpacing', async () => {
      const trackRows = document.querySelectorAll(
        '[data-testid="tracklist-row"]',
      );
      return Array.from(trackRows).map((row) => {
        const thumbnail = row.querySelector('img')?.getAttribute('src') || '';

        // 트랙명 추출
        const title =
          row.querySelector('.encore-text-body-medium[dir="auto"]')
            ?.textContent || '';

        // 아티스트명 추출
        const artistElement = row.querySelector(
          '.encore-text-body-small a[href*="/artist/"]',
        );
        const artist = artistElement?.textContent || '';

        // 앨범명 추출
        const albumElement = row.querySelector('a[href*="/album/"]');
        const album = albumElement?.textContent || '';

        return {
          title,
          artist,
          album,
          thumbnail,
        };
      });
    });
  };

  isSpotifyUrl = (url: string): boolean => {
    return url.includes('spotify.com');
  };

  getSpotifyAuthUrl = (): string => {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      scope: this.config.scopes.join(' '),
      redirect_uri: this.config.redirectUri,
    });
    return `${this.config.authEndpoint}?${params.toString()}`;
  };

  async exchangeCodeForAccessToken(code: string): Promise<string> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.config.redirectUri,
    });
    const response = await fetch(
      `${this.config.tokenEndpoint}?${params.toString()}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(
            `${this.config.clientId}:${this.config.clientSecret}`,
          ).toString('base64')}`,
        },
        body: params.toString(),
      },
    );
    if (!response.ok) {
      throw new Error('Failed to exchange code for access token');
    }
    const data = await response.json();
    return data.access_token;
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });
    const response = await fetch(
      `${this.config.tokenEndpoint}?${params.toString()}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(
            `${this.config.clientId}:${this.config.clientSecret}`,
          ).toString('base64')}`,
        },
        body: params.toString(),
      },
    );
    if (!response.ok) {
      throw new Error('Failed to refresh access token');
    }
    const data = await response.json();
    return data.access_token;
  }

  /**
   * 플레이리스트를 스포티파이에 저장하는 함수
   * @param accessToken 스포티파이 액세스 토큰
   * @param playlistJSON 플레이리스트 JSON
   * @returns 스포티파이 플레이리스트 ID
   * accessToken 바탕으로 플레이리스트 생성
   * 플레이스트 JSON 바탕으로 song id 검색 후 배열에 저장
   * 배열 바탕으로 플레이리스트에 추가
   */
  async convertToSpotifyPlaylist(
    spotifyUserId: string,
    accessToken: string,
    playlistJSON: PlaylistJSON[],
  ): Promise<{
    playlistName: string;
    playlistId: string;
    playlistUri: string;
  }> {
    const maxConcurrency = this.config.apiLimitPerSecond;
    const queue: Promise<void>[] = [];
    const validSongUris = [];

    const runTask = async (song: PlaylistJSON) => {
      try {
        const result = await this.searchSong(accessToken, {
          title: song.title,
          artist: song.artist,
        });
        if (result) {
          validSongUris.push(result.songUri);
        }
      } catch (error) {
        console.error(
          `Error searching for song ${song.title} by ${song.artist}: ${error}`,
        );
      }
    };

    try {
      const playlist = await this.createPlaylist(
        spotifyUserId,
        accessToken,
        playlistJSON[0].title,
      );
      for (const song of playlistJSON) {
        const task = runTask(song).finally(() => {
          queue.splice(queue.indexOf(task), 1);
        });
        queue.push(task);
        if (queue.length >= maxConcurrency) {
          await Promise.race(queue);
        }
      }
      await Promise.allSettled(queue);

      await this.addSongToPlaylist(
        accessToken,
        playlist.playlistId,
        validSongUris,
      );

      return playlist;
    } catch (error) {
      throw new Error(`Failed to convert to Spotify playlist: ${error}`);
    }
  }

  async createPlaylist(
    spotifyUserId: string,
    accessToken: string,
    playlistName?: string,
  ): Promise<{
    playlistName: string;
    playlistId: string;
    playlistUri: string;
  }> {
    const url = `${this.config.apiEndpoint}/users/${spotifyUserId}/playlists`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: playlistName ?? 'New Playlist',
        public: true,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error('Failed to create playlist');
    }
    return {
      playlistName,
      playlistId: data.id,
      playlistUri: data.uri,
    };
  }

  async searchSong(
    accessToken: string,
    songData: { title: string; artist: string },
    maxRetries = 3,
  ): Promise<{ songUri: string } | null> {
    let retries = 0;

    while (retries < maxRetries) {
      try {
        const query = songData.artist
          ? `track:${songData.title} artist:${songData.artist}`
          : `track:${songData.title}`;
        const url = `${this.config.apiEndpoint}/search?q=${query}&type=track&limit=1`;

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (response.status === 429) {
          const retryAfter = parseInt(
            response.headers.get('Retry-After') || '1',
          );
          await new Promise((resolve) =>
            setTimeout(resolve, retryAfter * 1000),
          );
          retries++;
          continue;
        }

        if (!response.ok) {
          throw new Error(
            `Search failed: ${response.status} - ${response.statusText}`,
          );
        }

        const data = await response.json();
        return data.tracks.items[0]
          ? { songUri: data.tracks.items[0].uri }
          : null;
      } catch (error) {
        retries++;
        if (retries === maxRetries) {
          console.error(
            `Failed to search song after ${maxRetries} retries`,
            error,
          );
          return null;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * retries)); // 지수형 대기 시간
      }
    }
  }

  async addSongToPlaylist(
    accessToken: string,
    playlistId: string,
    songUris: { songUri: string }[],
  ): Promise<void> {
    const url = `${this.config.apiEndpoint}/playlists/${playlistId}/tracks`;
    try {
      for (let i = 0; i < songUris.length; i += this.config.addSongBatchSize) {
        const batch = songUris.slice(i, i + this.config.addSongBatchSize);
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uris: batch.map((song) => song.songUri),
          }),
        });
        if (!response.ok) {
          throw new Error('Failed to add song to playlist');
        }
      }
    } catch (error) {
      throw new Error(`Failed to add song to playlist: ${error}`);
    }
  }
}
