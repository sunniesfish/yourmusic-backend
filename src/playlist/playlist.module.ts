import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Playlist } from './entities/playlist.entity';
import { PlaylistService } from './playlist.service';
import { PlaylistResolver } from './playlist.resolver';
import { YouTubeModule } from './youtube/youtube.module';
import { SpotifyModule } from './spotify/spotify.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Playlist]),
    YouTubeModule,
    SpotifyModule,
    AuthModule,
  ],
  providers: [PlaylistService, PlaylistResolver],
  exports: [PlaylistService],
})
export class PlaylistModule {}
