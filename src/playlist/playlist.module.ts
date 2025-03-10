import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Playlist } from './entities/playlist.entity';
import { PlaylistService } from './core/services/playlist.service';
import { PlaylistResolver } from './core/resolvers/playlist.resolver';
import { YouTubeModule } from './providers/youtube/youtube.module';
import { SpotifyModule } from './providers/spotify/spotify.module';
import { ScraperModule } from './providers/scraper/scraper.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Playlist]),
    YouTubeModule,
    SpotifyModule,
    ScraperModule,
    AuthModule,
  ],
  providers: [PlaylistService, PlaylistResolver],
  exports: [PlaylistService],
})
export class PlaylistModule {}
