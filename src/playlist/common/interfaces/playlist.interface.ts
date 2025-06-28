import { PlaylistMetadata } from 'src/database/firestore/interfaces/playlist.interface';
export interface PlaylistsResponse {
  edges: PlaylistEdge[];
  pageInfo: PageInfo;
}

export interface PlaylistEdge {
  node: PlaylistMetadata;
  cursor: string;
}

export interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

export type PageCursor = {
  playlistId: string;
  name: string;
  createdAt: Date;
};
