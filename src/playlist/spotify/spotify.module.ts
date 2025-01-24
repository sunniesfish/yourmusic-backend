import { Module } from '@nestjs/common';
import { SpotifyService } from './spotify.service';
import { ScraperModule } from '../scraper/scraper.module';
import { SpotifyConfigService } from './spotify.config';
import { SpotifyApiClient } from './spotify-api.client';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [ScraperModule, AuthModule],
  providers: [SpotifyService, SpotifyConfigService, SpotifyApiClient],
  exports: [SpotifyService],
})
export class SpotifyModule {}
