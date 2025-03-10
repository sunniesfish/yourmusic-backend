import { Injectable } from '@nestjs/common';
import { MutateStatisticInput } from '../dto/mutate-statistic.input';
import { InjectRepository } from '@nestjs/typeorm';
import { Statistic } from '../entities/statistic.entity';
import { Repository } from 'typeorm';

@Injectable()
export class StatisticService {
  constructor(
    @InjectRepository(Statistic)
    private readonly statisticRepository: Repository<Statistic>,
  ) {}

  async create(mutateStatisticInput: MutateStatisticInput, userId: string) {
    const statistic = this.statisticRepository.create({
      ...mutateStatisticInput,
      user: { id: userId },
    });
    return await this.statisticRepository.save(statistic);
  }

  async findOne(userId: string) {
    return await this.statisticRepository.findOne({
      where: { user: { id: userId } },
    });
  }

  async update(userId: string, mutateStatisticInput: MutateStatisticInput) {
    return await this.statisticRepository.update(userId, mutateStatisticInput);
  }

  async remove(userId: string) {
    return await this.statisticRepository.delete(userId);
  }
}
