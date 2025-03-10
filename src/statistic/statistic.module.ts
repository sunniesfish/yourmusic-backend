import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticService } from './services/statistic.service';
import { Statistic } from './entities/statistic.entity';
import { StatisticResolver } from './resolver/statistic.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Statistic])],
  providers: [StatisticService, StatisticResolver],
  exports: [StatisticService],
})
export class StatisticModule {}
