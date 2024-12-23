import { Injectable } from '@nestjs/common';
import { PlaylistJSON } from '../dto/playlist-json.input';
import { YouTubeConfig } from '../config/youtubeConfig';
import { YouTubeApiClient } from './youtube-api.client';

@Injectable()
export class YouTubePlaylistService {
  constructor(
    private readonly youtubeApiClient: YouTubeApiClient,
    private readonly config: YouTubeConfig,
  ) {}

  async convertPlaylist(
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
      this.handleError(error);
      return false;
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

  private handleError(error: any): void {
    // 에러 처리 및 로깅
    if (error instanceof YouTubeApiError) {
      // API 관련 에러 처리
    } else {
      // 기타 에러 처리
    }
  }
}
