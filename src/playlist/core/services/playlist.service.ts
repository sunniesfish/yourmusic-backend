import { forwardRef, Inject, Injectable } from '@nestjs/common';
import {
  ConvertedPlaylist,
  PlaylistJSON,
  SavePlaylistInput,
} from 'src/playlist/common/dto/playlists.dto';
import { DataSource, Repository } from 'typeorm';
import { Playlist } from '../../entities/playlist.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { YouTubeService } from '../../providers/youtube/youtube.service';
import { SpotifyService } from '../../providers/spotify/spotify.service';
@Injectable()
export class PlaylistService {
  constructor(
    @InjectRepository(Playlist)
    private readonly playlistRepository: Repository<Playlist>,
    @Inject(forwardRef(() => SpotifyService))
    private readonly spotifyService: SpotifyService,
    @Inject(forwardRef(() => YouTubeService))
    private readonly youtubeService: YouTubeService,
    private readonly dataSource: DataSource,
  ) {}

  // need to fix - return type
  async convertToSpotifyPlaylist(
    userId: string,
    accessToken: string,
    playlistJSON: PlaylistJSON[],
  ): Promise<ConvertedPlaylist> {
    const convertedPlaylist =
      await this.spotifyService.convertToSpotifyPlaylist(
        userId,
        accessToken,
        playlistJSON,
      );
    return convertedPlaylist;
  }

  async convertToYoutubePlaylist(
    userId: string | null,
    accessToken: string,
    playlistJSON: PlaylistJSON[],
  ): Promise<ConvertedPlaylist> {
    const convertedPlaylist =
      await this.youtubeService.convertToYoutubePlaylist(
        userId,
        accessToken,
        playlistJSON,
      );
    return {
      success: true,
      message: 'Playlist converted successfully',
      playlistId: convertedPlaylist.playlistId,
      playlistName: convertedPlaylist.playlistName,
      playlistUrl: convertedPlaylist.playlistUrl,
    };
  }

  async read(link: string): Promise<PlaylistJSON[]> {
    if (!link) {
      throw new Error('Please provide a valid URL');
    }

    const isSpotify = this.spotifyService.isSpotifyUrl(link);

    if (isSpotify) {
      console.log('isSpotify', isSpotify);
      return await this.spotifyService.readSpotifyPlaylist(link);
    }

    const isYoutube = this.youtubeService.isYoutubeUrl(link);

    if (isYoutube) {
      console.log('isYoutube', isYoutube);
      return await this.youtubeService.readYoutubePlaylist(link);
    }

    if (!isSpotify && !isYoutube) {
      console.log('not spotify or youtube');
      throw new Error('Please provide a valid Spotify or YouTube URL');
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
        thumbnail: savePlaylistInput.listJson[0].thumbnail,
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

  async findAll(
    userId: string,
    page: number,
    limit: number,
    orderBy: string,
    fields: string[],
  ) {
    const skip = (page - 1) * limit;
    const query = this.playlistRepository.createQueryBuilder('playlist');

    // 요청된 필드만 선택
    if (fields.length > 0) {
      fields.forEach((field) => {
        if (field === 'id') query.addSelect('playlist.id');
        if (field === 'name') query.addSelect('playlist.name');
        if (field === 'thumbnail') query.addSelect('playlist.thumbnail');
        if (field === 'createdAt') query.addSelect('playlist.createdAt');
        if (field === 'listJson') query.addSelect('playlist.listJson');
      });
    } else {
      // 기본 필드 선택
      query.select([
        'playlist.id',
        'playlist.name',
        'playlist.thumbnail',
        'playlist.createdAt',
      ]);
    }

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

    return {
      playlists,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    return await this.playlistRepository.findOne({
      where: { id },
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
