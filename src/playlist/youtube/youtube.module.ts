import { Module } from '@nestjs/common';
import { YoutubeService } from './youtube.service';
import { CommonModule } from '../common/comon.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [CommonModule, AuthModule],
  providers: [YoutubeService],
  exports: [YoutubeService],
})
export class YoutubeModule {}
