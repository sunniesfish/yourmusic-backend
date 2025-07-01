import {
  BadRequestException,
  forwardRef,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ConvertedPlaylist,
  GetPlaylistsByUserArgs,
  MutatePlaylistInput,
  PlaylistJSON,
} from 'src/playlist/common/dto/playlists.dto';

import { YouTubeService } from '../../providers/youtube/youtube.service';
import { SpotifyService } from '../../providers/spotify/spotify.service';
import {
  Firestore,
  Transaction,
  Query,
  DocumentData,
} from '@google-cloud/firestore';
import {
  PlaylistDocument,
  PlaylistMetadata,
} from 'src/firestore/interfaces/playlist.interface';
import {
  PageCursor,
  PageInfo,
  PlaylistsResponse,
} from 'src/playlist/common/interfaces/playlist.interface';
@Injectable()
export class PlaylistService {
  private readonly USER_COLLECTION = 'users';
  private readonly PLAYLIST_COLLECTION = 'playlists';
  private readonly USER_PLAYLIST_COLLECTION = 'userPlaylists';
  constructor(
    @Inject(forwardRef(() => SpotifyService))
    private readonly spotifyService: SpotifyService,
    @Inject(forwardRef(() => YouTubeService))
    private readonly youtubeService: YouTubeService,

    @Inject('FIRESTORE')
    private readonly firestore: Firestore,
  ) {}

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
      return await this.spotifyService.readSpotifyPlaylist(link);
    }

    const isYoutube = this.youtubeService.isYoutubeUrl(link);

    if (isYoutube) {
      return await this.youtubeService.readYoutubePlaylist(link);
    }

    if (!isSpotify && !isYoutube) {
      throw new Error('Please provide a valid Spotify or YouTube URL');
    }
  }

  async create(
    mutatePlaylistInput: MutatePlaylistInput,
    userId: string,
  ): Promise<boolean> {
    return await this.firestore.runTransaction(async (transaction) => {
      if (!mutatePlaylistInput.name?.trim()) {
        throw new BadRequestException('Playlist name is required');
      }

      if (!mutatePlaylistInput.listJson?.length) {
        throw new BadRequestException(
          'Playlist must contain at least one song',
        );
      }

      const userRef = this.firestore
        .collection(this.USER_COLLECTION)
        .doc(userId);

      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new NotFoundException('User not found');
      }

      const playlistMetadataRef = userRef
        .collection(this.USER_PLAYLIST_COLLECTION)
        .doc();

      const newPlaylistMetadata: PlaylistMetadata = {
        playlistId: playlistMetadataRef.id,
        name: mutatePlaylistInput.name,
        thumbnail: mutatePlaylistInput.listJson?.[0]?.thumbnail,
        createdAt: new Date(),
      };

      const playlistDocumentRef = this.firestore
        .collection(this.PLAYLIST_COLLECTION)
        .doc(playlistMetadataRef.id);

      const newPlaylistDocument: PlaylistDocument = {
        ...newPlaylistMetadata,
        ownerId: userId,
        listJson: mutatePlaylistInput.listJson,
      };

      transaction.set(playlistMetadataRef, newPlaylistMetadata);
      transaction.set(playlistDocumentRef, newPlaylistDocument);
      return true;
    });
  }

  async getPlaylistsPageByUser(
    args: GetPlaylistsByUserArgs,
  ): Promise<PlaylistsResponse> {
    const { userId, orderBy, limit, after } = args;

    let query: Query<DocumentData> = this.firestore
      .collection(this.USER_COLLECTION)
      .doc(userId)
      .collection(this.USER_PLAYLIST_COLLECTION);

    if (orderBy === 'createdAt') {
      query = query.orderBy('createdAt', 'desc');
    } else {
      query = query.orderBy('name', 'asc').orderBy('createdAt', 'desc');
    }

    query = query.limit(limit + 1);

    if (after) {
      const afterValue = this.validateAfter(after);
      if (orderBy === 'createdAt') {
        query = query.startAfter(afterValue.createdAt);
      } else {
        query = query.startAfter(afterValue.name, afterValue.createdAt);
      }
    }

    const metadataSnapshots = await query.get();
    const metadataDocs = metadataSnapshots.docs;

    const hasNextPage = metadataDocs.length > limit;
    const docs = hasNextPage ? metadataDocs.slice(0, limit) : metadataDocs;

    const edges = docs.map((doc) => {
      const data = doc.data();
      return {
        node: data as PlaylistMetadata,
        cursor: Buffer.from(
          JSON.stringify({
            playlistId: doc.id,
            name: data.name,
            createdAt: data.createdAt.toISOString(),
          }),
        ).toString('base64'),
      };
    });
    const pageInfo: PageInfo = {
      hasNextPage,
      endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
    };

    return {
      edges,
      pageInfo,
    };
  }

  async findOne(
    playlistId: string,
    fields: Array<keyof PlaylistDocument> = [],
  ): Promise<Partial<PlaylistDocument>> {
    const playlistRef = this.firestore
      .collection(this.PLAYLIST_COLLECTION)
      .doc(playlistId);

    const playlistDoc = await playlistRef.get();
    if (!playlistDoc.exists) {
      throw new NotFoundException('Playlist not found');
    }

    const playlist = playlistDoc.data() as PlaylistDocument;

    const filtered: Partial<PlaylistDocument> = {};

    for (const field of fields) {
      if (playlist[field] !== undefined) {
        (filtered as any)[field] = playlist[field];
      }
    }

    return filtered;
  }

  async remove(playlistId: string, userId: string, transaction?: Transaction) {
    if (!transaction) {
      return await this.firestore.runTransaction(async (transaction) => {
        return await this.remove(playlistId, userId, transaction);
      });
    }

    const playlistMetadataRef = this.firestore
      .collection(this.USER_COLLECTION)
      .doc(userId)
      .collection(this.USER_PLAYLIST_COLLECTION)
      .doc(playlistId);

    const playlistMetadataDoc = await transaction.get(playlistMetadataRef);
    if (!playlistMetadataDoc.exists) {
      throw new NotFoundException('Playlist not found');
    }

    const playlistRef = this.firestore
      .collection(this.PLAYLIST_COLLECTION)
      .doc(playlistMetadataDoc.id);

    const playlistDoc = await transaction.get(playlistRef);
    if (!playlistDoc.exists) {
      throw new NotFoundException('Playlist not found');
    }
    if (playlistDoc.data()?.ownerId !== userId) {
      throw new ForbiddenException('Insufficient permissions');
    }

    transaction.delete(playlistRef);
    transaction.delete(playlistMetadataRef);
    return true;
  }

  async update(
    playlistId: string,
    userId: string,
    mutatePlaylistInput: MutatePlaylistInput,
  ) {
    return await this.firestore.runTransaction(async (transaction) => {
      const playlistMetadataRef = this.firestore
        .collection(this.USER_COLLECTION)
        .doc(userId)
        .collection(this.USER_PLAYLIST_COLLECTION)
        .doc(playlistId);

      const playlistMetadataDoc = await transaction.get(playlistMetadataRef);
      if (!playlistMetadataDoc.exists) {
        throw new NotFoundException('Playlist not found');
      }

      const playlistRef = this.firestore
        .collection(this.PLAYLIST_COLLECTION)
        .doc(playlistMetadataDoc.id);

      const playlistDoc = await transaction.get(playlistRef);
      if (!playlistDoc.exists) {
        throw new NotFoundException('Playlist not found');
      }

      if (playlistDoc.data()?.ownerId !== userId) {
        throw new ForbiddenException('Insufficient permissions');
      }

      transaction.update(playlistMetadataRef, {
        name: mutatePlaylistInput.name,
        thumbnail: mutatePlaylistInput.listJson?.[0]?.thumbnail,
      });

      transaction.update(playlistRef, {
        ...playlistDoc.data(),
        listJson: mutatePlaylistInput.listJson,
      });

      return true;
    });
  }

  private validateAfter(after: string): PageCursor {
    const afterValue = JSON.parse(Buffer.from(after, 'base64').toString());
    if (!afterValue.name || !afterValue.createdAt || !afterValue.playlistId) {
      throw new BadRequestException('Invalid after value');
    }
    return afterValue;
  }
}
