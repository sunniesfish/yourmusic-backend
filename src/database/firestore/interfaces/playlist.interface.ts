import { PlaylistJSON } from '../../../playlist/common/dto/playlists.dto';

export interface PlaylistDocument {
  playlistId: string;
  name: string;
  listJson: PlaylistJSON[];
  thumbnail?: string;
  createdAt: Date;
  userId: string;
}
