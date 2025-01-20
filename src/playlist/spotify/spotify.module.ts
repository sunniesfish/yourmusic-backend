import { Module } from '@nestjs/common';
import { SpotifyService } from './spotify.service';
import { CommonModule } from '../common/comon.module';
import { SpotifyConfigService } from './spotify.config';
import { SpotifyApiClient } from './spotify-api.client';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [CommonModule, AuthModule],
  providers: [SpotifyService, SpotifyConfigService, SpotifyApiClient],
  exports: [SpotifyService],
})
export class SpotifyModule {}
