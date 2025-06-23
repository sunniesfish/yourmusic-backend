import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
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
import { FirestoreUtil } from 'src/database/firestore/util/utill';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class UserService {
  private readonly SALT_ROUNDS: number;
  private readonly COLLECTION_NAME = 'users';
  constructor(
    @Inject('FIRESTORE')
    private firestore: Firestore,
    private readonly configService: ConfigService,
  ) {
    this.SALT_ROUNDS = parseInt(this.configService.get('SALT_ROUNDS'));
  }

  async update(
    userServiceData: Partial<UserDocument>,
    transaction?: Transaction,
  ): Promise<boolean> {
    const sanitizedUpdate = this.sanitizeUserData(userServiceData);
    if (!transaction) {
      return await this.firestore.runTransaction(async (tx) => {
        return await this.runUpdateTransaction(
          userServiceData.userId,
          sanitizedUpdate,
          tx,
        );
      });
    }
    return await this.runUpdateTransaction(
      userServiceData.userId,
      sanitizedUpdate,
      transaction,
    );
  }

  async runUpdateTransaction(
    userId: string,
    sanitizedUpdate: Partial<UserDocument>,
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

    const flattenedUpdate = FirestoreUtil.flattenObject(sanitizedUpdate);
    transaction.update(userRef, flattenedUpdate);
    return true;
  }

  async findOne(
    userId: string,
    fields: Array<keyof UserDocument>,
    transaction?: Transaction,
  ): Promise<Partial<UserDocument>> {
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
    const filtered: Partial<UserDocument> = {};

    for (const field of fields) {
      if (userData[field] !== undefined) {
        (filtered as any)[field] = userData[field];
      }
    }

    return filtered;
  }

  async create(
    userServiceData: Partial<UserDocument>,
    transaction?: Transaction,
  ): Promise<User> {
    const userData = this.sanitizeUserData(userServiceData);
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
    userServiceData: Partial<UserDocument>,
    transaction: Transaction,
  ): Promise<User> {
    if (await this.checkId(userServiceData.userId, transaction)) {
      throw new ConflictException('User with same ID already exists');
    }
    const userRef = this.firestore
      .collection(this.COLLECTION_NAME)
      .doc(userServiceData.userId);

    const hashedPassword = await bcrypt.hash(
      userServiceData.password,
      this.SALT_ROUNDS,
    );
    userServiceData.password = hashedPassword;
    const flattenedUser = FirestoreUtil.flattenObject(userServiceData);
    transaction.set(userRef, flattenedUser);
    return {
      userId: userServiceData.userId,
      name: userServiceData.name,
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
  ): Promise<Partial<UserDocument>> {
    let user: Partial<UserDocument>;
    if (!transaction) {
      user = await this.findOne(userId, ['password', 'userId', 'name']);
    } else {
      user = await this.findOne(
        userId,
        ['password', 'userId', 'name'],
        transaction,
      );
    }
    if (!(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid password');
    }
    return user;
  }

  async updatePassword(userId: string, newPassword: string): Promise<boolean> {
    const result = await this.update({
      userId: userId,
      password: newPassword,
    });
    return result;
  }

  private sanitizeUserData(
    userServiceData: Partial<UserDocument>,
  ): Partial<UserDocument> {
    const result: Partial<UserDocument> = {};

    if (userServiceData.userId) result.userId = userServiceData.userId.trim();
    if (userServiceData.password)
      result.password = userServiceData.password.trim();
    if (userServiceData.name) result.name = userServiceData.name.trim();
    if (userServiceData.profileImg)
      result.profileImg = userServiceData.profileImg.trim();

    return result;
  }
}
