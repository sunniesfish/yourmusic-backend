import { Module } from '@nestjs/common';
import { YouTubeService } from './youtube.service';
import { AuthModule } from 'src/auth/auth.module';
import { YouTubeConfigService } from './youtubeConfig';
import { YouTubeApiClient } from './youtube-api.client';
import { ScraperModule } from '../scraper/scraper.module';

@Module({
  imports: [AuthModule, ScraperModule],
  providers: [YouTubeService, YouTubeConfigService, YouTubeApiClient],
  exports: [YouTubeService],
})
export class YouTubeModule {}
