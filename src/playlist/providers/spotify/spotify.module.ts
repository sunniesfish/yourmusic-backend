import { Module } from '@nestjs/common';
import { SpotifyService } from './spotify.service';
import { ScraperModule } from '../scraper/scraper.module';
import { SpotifyApiClient } from './client/spotify-api.client';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [ScraperModule, AuthModule],
  providers: [SpotifyService, SpotifyApiClient],
  exports: [SpotifyService],
})
export class SpotifyModule {}
