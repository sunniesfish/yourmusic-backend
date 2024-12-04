import { Injectable } from '@nestjs/common';
import { SavePlaylistInput } from './dto/save-playlist.input';
import { PlaylistJSON } from './dto/playlist-json.input';
import { DataSource, Repository } from 'typeorm';
import { Playlist } from './entities/playlist.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { isSpotifyUrl, readSpotifyPlaylist } from './util/spotify-util';
import { isYoutubeUrl, readYoutubePlaylist } from './util/youtube-util';

@Injectable()
export class PlaylistService {
  constructor(
    @InjectRepository(Playlist)
    private readonly playlistRepository: Repository<Playlist>,

    private readonly dataSource: DataSource,
  ) {}

  convertToSpotifyPlaylist(playlistJSON: PlaylistJSON[]) {
    console.log(playlistJSON);
    return true;
  }

  convertToYoutubePlaylist(playlistJSON: PlaylistJSON[]) {
    console.log(playlistJSON);
    return true;
  }

  async read(link: string): Promise<PlaylistJSON[]> {
    if (!link) {
      throw new Error('Please provide a valid URL');
    }

    const isSpotify = isSpotifyUrl(link);
    const isYoutube = isYoutubeUrl(link);

    if (!isSpotify && !isYoutube) {
      throw new Error('Please provide a valid Spotify or YouTube URL');
    }

    if (isSpotify) {
      return await readSpotifyPlaylist(link);
    }

    if (isYoutube) {
      return await readYoutubePlaylist(link);
    }
  }

  async create(savePlaylistInput: SavePlaylistInput) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    console.log(savePlaylistInput);
    return 'This action adds a new playlist';
  }

  async findAll(userId: string) {
    return await this.playlistRepository.find({
      where: { user: { id: userId } },
    });
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
