import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { StatisticService } from './statistic.service';
import { Statistic } from './entities/statistic.entity';
import { SaveStatisticInput } from './dto/save-statistic.input';
import { UpdateStatisticInput } from './dto/update-statistic.input';
@Resolver(() => Statistic)
export class StatisticResolver {
  constructor(private readonly statisticService: StatisticService) {}

  @Mutation(() => Statistic)
  saveStatistic(
    @Args('saveStatisticInput') saveStatisticInput: SaveStatisticInput,
  ) {
    return this.statisticService.create(saveStatisticInput);
  }

  @Query(() => Statistic, { name: 'statistic' })
  findOne(@Args('userId', { type: () => ID }) userId: string) {
    return this.statisticService.findOne(userId);
  }

  @Mutation(() => Statistic)
  updateStatistic(
    @Args('updateStatisticInput') updateStatisticInput: UpdateStatisticInput,
  ) {
    return this.statisticService.update(
      updateStatisticInput.userId,
      updateStatisticInput,
    );
  }

  @Mutation(() => Statistic)
  removeStatistic(@Args('userId', { type: () => ID }) userId: string) {
    return this.statisticService.remove(userId);
  }
}
