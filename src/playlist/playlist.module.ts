import { Module } from '@nestjs/common';
import { PlaylistService } from './core/services/playlist.service';
import { PlaylistResolver } from './core/resolvers/playlist.resolver';

@Module({
  providers: [PlaylistService, PlaylistResolver],
  exports: [PlaylistService],
})
export class PlaylistModule {}
