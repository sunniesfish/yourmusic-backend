import { Injectable } from '@nestjs/common';
import { CreatePlaylistInput } from '../../dto/create-playlist.input';
import { UpdatePlaylistInput } from '../../dto/update-playlist.input';

@Injectable()
export class PlaylistService {
  create(createPlaylistInput: CreatePlaylistInput) {
    return 'This action adds a new playlist';
  }

  findAll() {
    return `This action returns all playlist`;
  }

  findOne(id: number) {
    return `This action returns a #${id} playlist`;
  }

  update(id: number, updatePlaylistInput: UpdatePlaylistInput) {
    return `This action updates a #${id} playlist`;
  }

  remove(id: number) {
    return `This action removes a #${id} playlist`;
  }
}
