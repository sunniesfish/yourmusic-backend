import { Module } from '@nestjs/common';
import { StatisticService } from './services/statistic.service';
import { StatisticResolver } from './resolver/statistic.resolver';

@Module({
  providers: [StatisticService, StatisticResolver],
  exports: [StatisticService],
})
export class StatisticModule {}
