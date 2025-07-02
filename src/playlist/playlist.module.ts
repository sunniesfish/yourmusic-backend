import { Module } from '@nestjs/common';
import { PlaylistService } from './core/services/playlist.service';
import { PlaylistResolver } from './core/resolvers/playlist.resolver';
import { SpotifyModule } from './providers/spotify/spotify.module';
import { YouTubeModule } from './providers/youtube/youtube.module';

@Module({
  imports: [SpotifyModule, YouTubeModule],
  providers: [PlaylistService, PlaylistResolver],
  exports: [PlaylistService],
})
export class PlaylistModule {}
