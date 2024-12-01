import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateUserInput } from '../dto/update-user';
import { SignUpInput } from 'src/auth/dto/sign-up.input';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async update(updateUserInput: UpdateUserInput) {
    const { id, ...update } = updateUserInput;

    const updatedUser = await this.userRepository.update(id, update);
    if (updatedUser.affected === 0) {
      throw new NotFoundException('User not found');
    }
    return true;
  }

  async findOne(
    id: string,
    fields: Array<keyof User>,
  ): Promise<User | undefined> {
    return this.userRepository.findOne({
      where: { id },
      select: fields.reduce((acc, field) => ({ ...acc, [field]: true }), {}),
    });
  }

  async create(user: SignUpInput): Promise<User> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const userWithSameId = await queryRunner.manager.findOne(User, {
        where: { id: user.id },
      });

      if (userWithSameId) {
        throw new Error('User with same ID already exists');
      }

      const createdUser = await queryRunner.manager.save(User, user);
      await queryRunner.commitTransaction();
      return createdUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
