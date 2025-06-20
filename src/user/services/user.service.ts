import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { UpdateUserInput } from '../dto/update-user.input';
import { SignUpInput } from 'src/auth/common/dto/sign-up.input';
import * as bcrypt from 'bcrypt';
import { Firestore } from '@google-cloud/firestore';
import { Inject } from '@nestjs/common';
import { UserDocument } from 'src/database/firestore/interfaces/user.interface';

@Injectable()
export class UserService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    @Inject('FIRESTORE')
    private firestore: Firestore,
  ) {}

  async update(updateUserInput: UpdateUserInput) {
    try {
      const { id, ...update } = updateUserInput;
      const userRef = this.firestore.collection('users').doc(id);
      await userRef.update(update);
      return true;
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }

  async findOne(
    id: string,
    fields: Array<keyof User>,
  ): Promise<Partial<User> | undefined> {
    try {
      const userRef = this.firestore.collection('users').doc(id);
      const doc = await userRef.get();

      if (!doc.exists) {
        throw new NotFoundException('User not found');
      }

      const userData = doc.data() as UserDocument;

      const filtered: Partial<UserDocument> = {};
      for (const field of fields) {
        if (userData[field] !== undefined) {
          filtered[field] = userData[field];
        }
      }
      return filtered;
    } catch (error) {
      throw new NotFoundException('User not found');
    }
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
