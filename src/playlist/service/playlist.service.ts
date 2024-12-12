import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { SavePlaylistInput } from '../dto/save-playlist.input';
import { PlaylistJSON } from '../dto/playlist-json.input';
import { DataSource, Repository } from 'typeorm';
import { Playlist } from '../entities/playlist.entity';
import { InjectRepository } from '@nestjs/typeorm';

import { SpotifyService } from './spotify.service';
import { YoutubeService } from './youtube.service';

@Injectable()
export class PlaylistService {
  constructor(
    @InjectRepository(Playlist)
    private readonly playlistRepository: Repository<Playlist>,
    @Inject(forwardRef(() => SpotifyService))
    private readonly spotifyService: SpotifyService,
    @Inject(forwardRef(() => YoutubeService))
    private readonly youtubeService: YoutubeService,
    private readonly dataSource: DataSource,
  ) {}

  async convertToSpotifyPlaylist(
    spotifyUserId: string,
    accessToken: string,
    playlistJSON: PlaylistJSON[],
  ) {
    return await this.spotifyService.convertToSpotifyPlaylist(
      spotifyUserId,
      accessToken,
      playlistJSON,
    );
  }

  convertToYoutubePlaylist(playlistJSON: PlaylistJSON[]) {
    console.log(playlistJSON);
    return true;
  }

  async read(link: string): Promise<PlaylistJSON[]> {
    if (!link) {
      throw new Error('Please provide a valid URL');
    }

    const isSpotify = this.spotifyService.isSpotifyUrl(link);
    const isYoutube = this.youtubeService.isYoutubeUrl(link);

    if (!isSpotify && !isYoutube) {
      throw new Error('Please provide a valid Spotify or YouTube URL');
    }

    if (isSpotify) {
      return await this.spotifyService.readSpotifyPlaylist(link);
    }

    if (isYoutube) {
      return await this.youtubeService.readYoutubePlaylist(link);
    }
  }

  async create(savePlaylistInput: SavePlaylistInput, userId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const playlist = this.playlistRepository.create({
        user: { id: userId },
        name: savePlaylistInput.name,
        listJson: savePlaylistInput.listJson,
      });
      await queryRunner.manager.save(playlist);
      await queryRunner.commitTransaction();
      return playlist;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(userId: string, page: number, limit: number, orderBy: string) {
    const skip = (page - 1) * limit;
    const query = this.playlistRepository.createQueryBuilder('playlist');

    query.where('playlist.userId = :userId', { userId });
    if (orderBy === 'createdAt') {
      query.orderBy('playlist.createdAt', 'DESC');
    }
    if (orderBy === 'name') {
      query.orderBy('playlist.name', 'ASC');
    }

    const [playlists, total] = await Promise.all([
      query.skip(skip).take(limit).getMany(),
      query.getCount(),
    ]);
    const totalPages = Math.ceil(total / limit);

    return {
      playlists,
      totalPages,
    };
  }

  async findOne(id: number, userId: string) {
    return await this.playlistRepository.findOne({
      where: { id, user: { id: userId } },
    });
  }

  async remove(id: number, userId: string) {
    const result = await this.playlistRepository.delete({
      id,
      user: { id: userId },
    });
    return result.affected === 1;
  }
}
