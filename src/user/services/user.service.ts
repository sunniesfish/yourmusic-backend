import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateUserInput } from '../dto/update-user.input';
import { SignUpInput } from 'src/auth/common/dto/sign-up.input';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async update(updateUserInput: UpdateUserInput) {
    const { id, ...update } = updateUserInput;
    console.log('///updateUserInput');
    console.log(id, update);
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

      const hashedPassword = await bcrypt.hash(user.password, this.SALT_ROUNDS);
      const createdUser = await queryRunner.manager.save(User, {
        ...user,
        password: hashedPassword,
      });
      await queryRunner.commitTransaction();
      return createdUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async checkId(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    return user ? true : false;
  }

  async validateUser(id: string, password: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) return false;
    return bcrypt.compare(password, user.password);
  }

  async updatePassword(userId: string, newPassword: string): Promise<boolean> {
    const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
    const result = await this.userRepository.update(
      { id: userId },
      { password: hashedPassword },
    );
    return result.affected > 0;
  }
}
