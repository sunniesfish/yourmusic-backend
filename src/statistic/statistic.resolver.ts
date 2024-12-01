import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { StatisticService } from './statistic.service';
import { Statistic } from './entities/statistic.entity';
import { SaveStatisticInput } from './dto/save-statistic.input';
import { UpdateStatisticInput } from './dto/update-statistic.input';
import { UserInput } from 'src/user/dto/user.input';
import { CurrentUser } from 'src/global/decorators/current-user';
import { ForbiddenException } from '@nestjs/common';
@Resolver(() => Statistic)
export class StatisticResolver {
  constructor(private readonly statisticService: StatisticService) {}

  @Mutation(() => Statistic)
  saveStatistic(
    @CurrentUser() user: UserInput,
    @Args('saveStatisticInput') saveStatisticInput: SaveStatisticInput,
  ) {
    if (user.id === undefined) {
      throw new ForbiddenException();
    }
    return this.statisticService.create(saveStatisticInput, user.id);
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
