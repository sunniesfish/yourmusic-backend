import { Injectable } from '@nestjs/common';
import { CreateStatisticInput } from './dto/create-statistic.input';
import { UpdateStatisticInput } from './dto/update-statistic.input';

@Injectable()
export class StatisticService {
  create(createStatisticInput: CreateStatisticInput) {
    return 'This action adds a new statistic';
  }

  findAll() {
    return `This action returns all statistic`;
  }

  findOne(id: number) {
    return `This action returns a #${id} statistic`;
  }

  update(id: number, updateStatisticInput: UpdateStatisticInput) {
    return `This action updates a #${id} statistic`;
  }

  remove(id: number) {
    return `This action removes a #${id} statistic`;
  }
}
