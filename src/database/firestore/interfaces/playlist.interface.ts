import { PlaylistJSON } from '../../../playlist/common/dto/playlists.dto';

export interface PlaylistDocument extends PlaylistMetadata {
  ownerId: string;
  listJson: PlaylistJSON[];
}

export interface PlaylistMetadata {
  playlistId: string;
  name: string;
  thumbnail?: string;
  createdAt: Date;
}
