import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlaylistService } from './playlist.service';
import { Playlist } from './entities/playlist.entity';
import { PlaylistResolver } from './playlist.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Playlist])],
  providers: [PlaylistService, PlaylistResolver],
  exports: [PlaylistService],
})
export class PlaylistModule {}
