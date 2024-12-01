import { Injectable } from '@nestjs/common';
import { SaveStatisticInput } from './dto/save-statistic.input';
import { UpdateStatisticInput } from './dto/update-statistic.input';
import { InjectRepository } from '@nestjs/typeorm';
import { Statistic } from './entities/statistic.entity';
import { Repository } from 'typeorm';

@Injectable()
export class StatisticService {
  constructor(
    @InjectRepository(Statistic)
    private readonly statisticRepository: Repository<Statistic>,
  ) {}

  async create(saveStatisticInput: SaveStatisticInput, userId: string) {
    const statistic = this.statisticRepository.create({
      ...saveStatisticInput,
      user: { id: userId },
    });
    return await this.statisticRepository.save(statistic);
  }

  async findOne(userId: string) {
    return await this.statisticRepository.findOne({
      where: { user: { id: userId } },
    });
  }

  async update(userId: string, updateStatisticInput: UpdateStatisticInput) {
    return await this.statisticRepository.update(userId, updateStatisticInput);
  }

  async remove(userId: string) {
    return await this.statisticRepository.delete(userId);
  }
}
