import { Module } from '@nestjs/common';
import { SpotifyService } from './spotify.service';
import { CommonModule } from '../common/comon.module';

@Module({
  imports: [CommonModule],
  providers: [SpotifyService],
  exports: [SpotifyService],
})
export class SpotifyModule {}
