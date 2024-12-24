import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Playlist } from './entities/playlist.entity';
import { PlaylistService } from './playlist.service';
import { PlaylistResolver } from './playlist.resolver';
import { YouTubeModule } from './youtube/youtube.module';
import { SpotifyModule } from './spotify/spotify.module';

@Module({
  imports: [TypeOrmModule.forFeature([Playlist]), YouTubeModule, SpotifyModule],
  providers: [PlaylistService, PlaylistResolver],
  exports: [PlaylistService],
})
export class PlaylistModule {}
