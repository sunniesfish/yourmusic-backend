import { Module } from '@nestjs/common';
import { YouTubeService } from './youtube.service';
import { AuthModule } from 'src/auth/auth.module';
import { YouTubeConfigService } from './youtubeConfig';
import { YouTubeApiClient } from './youtube-api.client';

@Module({
  imports: [AuthModule],
  providers: [YouTubeService, YouTubeConfigService, YouTubeApiClient],
  exports: [YouTubeService],
})
export class YouTubeModule {}
