import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { MutateStatisticInput } from '../dto/mutate-statistic.input';
import { UserService } from 'src/user/services/user.service';
@Injectable()
export class StatisticService {
  constructor(private readonly userService: UserService) {}

  async create(mutateStatisticInput: MutateStatisticInput, userId: string) {
    await this.userService.update({
      userId,
      statistic: {
        ...mutateStatisticInput,
        updatedAt: new Date(),
      },
    });
    return true;
  }

  async findOne(userId: string) {
    const doc = await this.userService.findOne(userId, ['statistic']);
    return doc.statistic;
  }

  async update(userId: string, mutateStatisticInput: MutateStatisticInput) {
    const updatedObject = {
      ...mutateStatisticInput,
      updatedAt: new Date(),
    };
    const result = await this.userService.update({
      userId,
      statistic: updatedObject,
    });
    if (!result) {
      throw new InternalServerErrorException('Failed to update statistic');
    }

    return updatedObject;
  }

  async remove(userId: string) {
    return await this.userService.update({
      userId,
      statistic: {
        artistRankJson: null,
        albumRankJson: null,
        titleRankJson: null,
        updatedAt: new Date(),
      },
    });
  }
}
