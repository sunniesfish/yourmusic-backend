import { Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { UserResolver } from './resolver/user.resolver';

@Module({
  providers: [UserService, UserResolver],
  exports: [UserService],
})
export class UserModule {}
