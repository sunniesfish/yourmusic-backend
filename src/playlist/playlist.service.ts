import { Injectable } from '@nestjs/common';
import { SavePlaylistInput } from './dto/save-playlist.input';
import { PlaylistJSON } from './dto/playlist-json.input';
@Injectable()
export class PlaylistService {
  convertToSpotifyPlaylist(playlistJSON: PlaylistJSON) {
    console.log(playlistJSON);
    return true;
  }

  convertToYoutubePlaylist(playlistJSON: PlaylistJSON) {
    console.log(playlistJSON);
    return true;
  }
  read(link: string) {
    console.log(link);
    const playlistJSON: PlaylistJSON[] = [];
    playlistJSON.push({
      title: 'test',
      artist: 'test',
      album: 'test',
      thumbnail: 'test',
    });
    return playlistJSON;
  }

  create(savePlaylistInput: SavePlaylistInput) {
    console.log(savePlaylistInput);
    return 'This action adds a new playlist';
  }

  findAll() {
    return `This action returns all playlist`;
  }

  findOne(id: number) {
    return `This action returns a #${id} playlist`;
  }

  remove(id: number) {
    return `This action removes a #${id} playlist`;
  }
}
