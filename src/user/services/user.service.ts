import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UpdateUserInput } from '../dto/update-user.input';
import { SignUpInput } from 'src/auth/common/dto/sign-up.input';
import * as bcrypt from 'bcrypt';
import {
  DocumentData,
  DocumentSnapshot,
  Firestore,
  Transaction,
} from '@google-cloud/firestore';
import { Inject } from '@nestjs/common';
import { UserDocument } from 'src/database/firestore/interfaces/user.interface';
import { User } from '../dto/user.object';
import { UserServiceData } from '../interfaces/user.interface';

@Injectable()
export class UserService {
  private readonly SALT_ROUNDS = 10;
  private readonly COLLECTION_NAME = 'users';
  constructor(
    @Inject('FIRESTORE')
    private firestore: Firestore,
  ) {}

  async update(
    updateUserInput: UpdateUserInput,
    transaction?: Transaction,
  ): Promise<boolean> {
    const sanitizedUpdate = this.sanitizeUserData(updateUserInput);
    if (!transaction) {
      return await this.firestore.runTransaction(async (tx) => {
        return await this.runUpdateTransaction(
          updateUserInput.userId,
          sanitizedUpdate,
          tx,
        );
      });
    }
    return await this.runUpdateTransaction(
      updateUserInput.userId,
      sanitizedUpdate,
      transaction,
    );
  }

  async runUpdateTransaction(
    userId: string,
    sanitizedUpdate: Partial<UserServiceData>,
    transaction: Transaction,
  ): Promise<boolean> {
    const userRef = this.firestore.collection(this.COLLECTION_NAME).doc(userId);

    if (!(await transaction.get(userRef)).exists) {
      throw new NotFoundException('User not found');
    }

    if (sanitizedUpdate.password) {
      const hashedPassword = await bcrypt.hash(
        sanitizedUpdate.password,
        this.SALT_ROUNDS,
      );
      sanitizedUpdate.password = hashedPassword;
    }

    transaction.update(userRef, sanitizedUpdate);
    return true;
  }

  async findOne(
    userId: string,
    fields: Array<keyof UserServiceData>,
    transaction?: Transaction,
  ): Promise<Partial<UserServiceData>> {
    const userRef = this.firestore.collection(this.COLLECTION_NAME).doc(userId);
    let doc: DocumentSnapshot<DocumentData>;

    if (transaction) {
      doc = await transaction.get(userRef);
    } else {
      doc = await userRef.get();
    }

    if (!doc.exists) {
      throw new NotFoundException('User not found');
    }

    const userData = doc.data() as UserDocument;
    const filtered: Partial<UserServiceData> = {};

    for (const field of fields) {
      if (userData[field] !== undefined) {
        (filtered as any)[field] = userData[field];
      }
    }

    return filtered;
  }

  async create(user: SignUpInput, transaction?: Transaction): Promise<User> {
    const userData = this.sanitizeUserData(user);
    if (!userData.userId || !userData.password || !userData.name) {
      throw new BadRequestException('Required fields are missing');
    }
    if (!transaction) {
      return await this.firestore.runTransaction(async (tx) => {
        return await this.runCreateTransaction(userData as SignUpInput, tx);
      });
    }
    return await this.runCreateTransaction(
      userData as SignUpInput,
      transaction,
    );
  }

  async runCreateTransaction(
    sanitizedUser: SignUpInput,
    transaction: Transaction,
  ): Promise<User> {
    if (await this.checkId(sanitizedUser.userId, transaction)) {
      throw new ConflictException('User with same ID already exists');
    }
    const userRef = this.firestore
      .collection(this.COLLECTION_NAME)
      .doc(sanitizedUser.userId);
    const hashedPassword = await bcrypt.hash(
      sanitizedUser.password,
      this.SALT_ROUNDS,
    );
    transaction.set(userRef, {
      userId: sanitizedUser.userId,
      password: hashedPassword,
      name: sanitizedUser.name,
      profileImg: sanitizedUser?.profileImg,
    });
    return {
      userId: sanitizedUser.userId,
      name: sanitizedUser.name,
    };
  }

  async checkId(userId: string, transaction?: Transaction): Promise<boolean> {
    const userRef = this.firestore.collection(this.COLLECTION_NAME).doc(userId);
    let doc: DocumentSnapshot<DocumentData>;

    if (transaction) {
      doc = await transaction.get(userRef);
    } else {
      doc = await userRef.get();
    }

    return doc.exists;
  }

  async validateUser(
    userId: string,
    password: string,
    transaction?: Transaction,
  ): Promise<void> {
    let user: Partial<UserServiceData>;
    if (!transaction) {
      user = await this.findOne(userId, ['password']);
    } else {
      user = await this.findOne(userId, ['password'], transaction);
    }
    if (!(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid password');
    }
  }

  async updatePassword(userId: string, newPassword: string): Promise<boolean> {
    const result = await this.update({
      userId: userId,
      password: newPassword,
    });
    return result;
  }

  private sanitizeUserData(user: Partial<SignUpInput>): Partial<SignUpInput> {
    const result: Partial<SignUpInput> = {};

    if (user.userId) result.userId = user.userId.trim();
    if (user.password) result.password = user.password.trim();
    if (user.name) result.name = user.name.trim();
    if (user.profileImg) result.profileImg = user.profileImg.trim();

    return result;
  }
}
