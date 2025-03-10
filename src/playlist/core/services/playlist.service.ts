import { forwardRef, Inject, Injectable } from '@nestjs/common';
import {
  ConvertedPlaylist,
  MutatePlaylistInput,
  PlaylistJSON,
} from 'src/playlist/common/dto/playlists.dto';
import { DataSource, Repository } from 'typeorm';
import { Playlist } from '../../entities/playlist.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { YouTubeService } from '../../providers/youtube/youtube.service';
import { SpotifyService } from '../../providers/spotify/spotify.service';
import { ApiDomain } from 'src/auth/common/enums/api-domain.enum';
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

  //need to add retry with new accessToken

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
    return convertedPlaylist;
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

  async create(mutatePlaylistInput: MutatePlaylistInput, userId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const playlist = this.playlistRepository.create({
        user: { id: userId },
        userId: userId,
        name: mutatePlaylistInput.name,
        thumbnail: mutatePlaylistInput.listJson[0].thumbnail,
        listJson: mutatePlaylistInput.listJson,
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

    if (fields.length > 0) {
      fields.forEach((field) => {
        if (field === 'id') query.addSelect('playlist.id');
        if (field === 'name') query.addSelect('playlist.name');
        if (field === 'thumbnail') query.addSelect('playlist.thumbnail');
        if (field === 'createdAt') query.addSelect('playlist.createdAt');
        if (field === 'listJson') query.addSelect('playlist.listJson');
      });
    } else {
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

  async findOne(id: number, fields: string[] = []) {
    const query = this.playlistRepository.createQueryBuilder('playlist');

    if (fields.length > 0) {
      fields.forEach((field) => {
        if (field === 'id') query.addSelect('playlist.id');
        if (field === 'name') query.addSelect('playlist.name');
        if (field === 'thumbnail') query.addSelect('playlist.thumbnail');
        if (field === 'createdAt') query.addSelect('playlist.createdAt');
        if (field === 'listJson') query.addSelect('playlist.listJson');
      });
    }
    return await query.where('playlist.id = :id', { id }).getOne();
  }

  async remove(id: number, userId: string) {
    const result = await this.playlistRepository.delete({
      id,
      user: { id: userId },
    });
    return result.affected === 1;
  }

  async update(
    id: number,
    userId: string,
    mutatePlaylistInput: MutatePlaylistInput,
  ) {
    const result = await this.playlistRepository.update(
      {
        id,
        user: { id: userId },
      },
      mutatePlaylistInput,
    );
    return result.affected === 1;
  }
}
