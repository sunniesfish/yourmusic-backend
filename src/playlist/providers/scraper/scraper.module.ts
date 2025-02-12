import { Module } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [ScraperService],
  exports: [ScraperService],
})
export class ScraperModule {}
