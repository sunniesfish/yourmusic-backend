import { Playlist } from 'src/playlist/entities/playlist.entity';

export interface PlaylistsResponse {
  edges: [PlaylistEdge];
  pageInfo: PageInfo;
}

export interface PlaylistEdge {
  node: Playlist;
  cursor: String;
}

export interface PageInfo {
  hasNextPage: Boolean;
  endCursor: String;
}
