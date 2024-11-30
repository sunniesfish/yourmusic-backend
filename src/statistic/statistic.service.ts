import { Injectable } from '@nestjs/common';
import { SaveStatisticInput } from './dto/save-statistic.input';
import { UpdateStatisticInput } from './dto/update-statistic.input';

@Injectable()
export class StatisticService {
  create(saveStatisticInput: SaveStatisticInput) {
    console.log(saveStatisticInput);
    return 'This action adds a new statistic';
  }

  findOne(userId: string) {
    return `This action returns a #${userId} statistic`;
  }

  update(userId: string, updateStatisticInput: UpdateStatisticInput) {
    console.log(updateStatisticInput);
    return `This action updates a #${userId} statistic`;
  }

  remove(userId: string) {
    return `This action removes a #${userId} statistic`;
  }
}
