import { Module } from '@nestjs/common';
import { YouTubeService } from './youtube.service';
import { AuthModule } from 'src/auth/auth.module';
import { ScraperModule } from '../scraper/scraper.module';
import { YouTubeConfigService } from './client/youtubeConfig';
import { YouTubeApiClient } from './client/youtube-api.client';

@Module({
  imports: [AuthModule, ScraperModule],
  providers: [YouTubeService, YouTubeConfigService, YouTubeApiClient],
  exports: [YouTubeService],
})
export class YouTubeModule {}
