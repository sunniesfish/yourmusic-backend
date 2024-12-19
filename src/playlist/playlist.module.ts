import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Playlist } from './entities/playlist.entity';
import { PlaylistService } from './playlist.service';
import { PlaylistResolver } from './playlist.resolver';
import { YoutubeModule } from './youtube/youtube.module';
import { SpotifyModule } from './spotify/spotify.module';

@Module({
  imports: [TypeOrmModule.forFeature([Playlist]), YoutubeModule, SpotifyModule],
  providers: [PlaylistService, PlaylistResolver],
  exports: [PlaylistService],
})
export class PlaylistModule {}
