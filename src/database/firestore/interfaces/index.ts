import { UserDocument } from './user.interface';
import { PlaylistDocument } from './playlist.interface';

export { UserDocument } from './user.interface';
export { PlaylistDocument } from './playlist.interface';
export const FIRESTORE_COLLECTIONS = {
  USERS: 'users',
  PLAYLISTS: 'playlists',
} as const;
export type FirestoreDocument = UserDocument | PlaylistDocument;
