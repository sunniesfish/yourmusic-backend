import { Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateUserInput } from '../dto/update-user';

@Injectable()
export class UserService {
  update(updateUserInput: UpdateUserInput) {
    console.log(updateUserInput);
    return true;
  }
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async findOne(id: string): Promise<User | undefined> {
    return await this.userRepository.findOne({ where: { id } });
  }

  async create(user: User): Promise<User> {
    return await this.userRepository.save(user);
  }
}
