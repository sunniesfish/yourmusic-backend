import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { StatisticService } from '../services/statistic.service';
import { Statistic } from '../dto/statistic.object';
import { MutateStatisticInput } from '../dto/mutate-statistic.input';
import { UserInput } from 'src/user/dto/user.input';
import { CurrentUser } from 'src/global/decorators/current-user';
import { ForbiddenException } from '@nestjs/common';
@Resolver(() => Statistic)
export class StatisticResolver {
  constructor(private readonly statisticService: StatisticService) {}

  @Mutation(() => Boolean)
  async saveStatistic(
    @CurrentUser() user: UserInput,
    @Args('saveStatisticInput') saveStatisticInput: MutateStatisticInput,
  ): Promise<boolean> {
    if (user.id === undefined) {
      throw new ForbiddenException();
    }
    return await this.statisticService.create(saveStatisticInput, user.id);
  }

  @Query(() => Statistic, { name: 'statistic' })
  async findOne(
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<Statistic> {
    return await this.statisticService.findOne(userId);
  }

  @Mutation(() => Statistic)
  async updateStatistic(
    @Args('updateStatisticInput') updateStatisticInput: MutateStatisticInput,
  ): Promise<Statistic> {
    return await this.statisticService.update(
      updateStatisticInput.userId,
      updateStatisticInput,
    );
  }

  @Mutation(() => Boolean)
  async removeStatistic(
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<boolean> {
    return await this.statisticService.remove(userId);
  }
}
