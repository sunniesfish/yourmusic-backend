import { registerEnumType } from '@nestjs/graphql';

export enum PlaylistStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

registerEnumType(PlaylistStatus, {
  name: 'PlaylistStatus',
  description: 'The status of a playlist conversion',
});
