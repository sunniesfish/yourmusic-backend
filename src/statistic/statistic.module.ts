import { Module } from '@nestjs/common';
import { StatisticService } from './services/statistic.service';
import { StatisticResolver } from './resolver/statistic.resolver';
import { UserModule } from 'src/user/user.module';
@Module({
  imports: [UserModule],
  providers: [StatisticService, StatisticResolver],
  exports: [StatisticService],
})
export class StatisticModule {}
