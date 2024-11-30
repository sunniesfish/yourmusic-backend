import { Module } from '@nestjs/common';
import { StatisticService } from './statistic.service';
import { StatisticResolver } from './statistic.resolver';

@Module({
  providers: [StatisticResolver, StatisticService],
})
export class StatisticModule {}
