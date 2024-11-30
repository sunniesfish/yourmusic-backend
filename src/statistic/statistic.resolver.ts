import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { StatisticService } from './statistic.service';
import { Statistic } from './entities/statistic.entity';
import { CreateStatisticInput } from './dto/create-statistic.input';
import { UpdateStatisticInput } from './dto/update-statistic.input';

@Resolver(() => Statistic)
export class StatisticResolver {
  constructor(private readonly statisticService: StatisticService) {}

  @Mutation(() => Statistic)
  createStatistic(
    @Args('createStatisticInput') createStatisticInput: CreateStatisticInput,
  ) {
    return this.statisticService.create(createStatisticInput);
  }

  @Query(() => [Statistic], { name: 'statistic' })
  findAll() {
    return this.statisticService.findAll();
  }

  @Query(() => Statistic, { name: 'statistic' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.statisticService.findOne(id);
  }

  @Mutation(() => Statistic)
  updateStatistic(
    @Args('updateStatisticInput') updateStatisticInput: UpdateStatisticInput,
  ) {
    return this.statisticService.update(
      updateStatisticInput.id,
      updateStatisticInput,
    );
  }

  @Mutation(() => Statistic)
  removeStatistic(@Args('id', { type: () => Int }) id: number) {
    return this.statisticService.remove(id);
  }
}
