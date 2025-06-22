import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../entities/user.entity';
import { UpdateUserInput } from '../dto/update-user.input';
import { SignUpInput } from 'src/auth/common/dto/sign-up.input';
import * as bcrypt from 'bcrypt';
import { Firestore } from '@google-cloud/firestore';
import { Inject } from '@nestjs/common';
import { UserDocument } from 'src/database/firestore/interfaces/user.interface';
import { UserInput } from '../dto/user.input';
import { SignInInput } from 'src/auth/common/dto/sign-in.input';
import { TransactionUtil } from 'src/database/firestore/util/transaction.utill';

@Injectable()
export class UserService {
  private readonly SALT_ROUNDS = 10;
  private readonly COLLECTION_NAME = 'users';
  constructor(
    @Inject('FIRESTORE')
    private firestore: Firestore,
  ) {}

  async update(updateUserInput: UpdateUserInput) {
    try {
      const { id, ...update } = updateUserInput;
      const userRef = this.firestore.collection(this.COLLECTION_NAME).doc(id);
      await userRef.update(update);
      return true;
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }

  async findOne(
    id: string,
    fields: Array<keyof User>,
    transaction?: FirebaseFirestore.Transaction,
  ): Promise<Partial<User> | undefined> {
    return await TransactionUtil.executeWithOptionalTransaction(
      this.firestore,
      transaction,
      async (tx) => {
        const userRef = this.firestore.collection(this.COLLECTION_NAME).doc(id);
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
      },
    );
  }

  async create(user: SignUpInput): Promise<User> {
    try {
      return await this.firestore.runTransaction(async (transaction) => {
        const userData = this.sanitizeUserData(user);
        if (!(await this.validateUser(userData.id, userData.password))) {
          throw Error('User with same ID already exists');
        }
        const userRef = this.firestore.collection(this.COLLECTION_NAME).doc();
        const hashedPassword = bcrypt.hash(user.password, this.SALT_ROUNDS);
        transaction.set(userRef, {
          id: userRef.id,
          userId: userData.id,
          password: hashedPassword,
        });
        return {
          id: user.id,
          name: user.name,
        };
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Fail to create user');
    }
  }

  async checkId(
    userId: string,
    transaction?: FirebaseFirestore.Transaction,
  ): Promise<boolean> {
    return await TransactionUtil.executeWithOptionalTransaction(
      this.firestore,
      transaction,
      async (tx) => {
        const userQuery = this.firestore
          .collection(this.COLLECTION_NAME)
          .where('userId', '==', userId);
        const userDoc = await tx.get(userQuery);
        return !userDoc.empty;
      },
    );
  }

  async validateUser(
    id: string,
    password: string,
    transaction?: FirebaseFirestore.Transaction,
  ): Promise<boolean> {
    return await TransactionUtil.executeWithOptionalTransaction(
      this.firestore,
      transaction,
      async (tx) => {
        const user = await this.findOne(id, ['password'], tx);
        if (!user) return false;
        return bcrypt.compare(password, user.password);
      },
    );
  }

  async updatePassword(userId: string, newPassword: string): Promise<boolean> {
    const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
    const result = await this.userRepository.update(
      { id: userId },
      { password: hashedPassword },
    );
    return result.affected > 0;
  }

  private sanitizeUserData(user: SignInInput): SignInInput {
    return {
      id: user.id.trim(),
      password: user.password.trim(),
    };
  }

  private async excuteCheckId(
    transaction: FirebaseFirestore.Transaction,
    userId: string,
  ) {}
}
