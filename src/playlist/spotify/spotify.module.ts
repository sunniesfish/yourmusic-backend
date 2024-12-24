import { Module } from '@nestjs/common';
import { SpotifyService } from './spotify.service';
import { CommonModule } from '../common/comon.module';
import { SpotifyConfigService } from './spotifyConfig';

@Module({
  imports: [CommonModule],
  providers: [SpotifyService, SpotifyConfigService],
  exports: [SpotifyService],
})
export class SpotifyModule {}
