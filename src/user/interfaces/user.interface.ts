import { User } from '../dto/user.object';

export interface UserServiceData extends User {
  password: string;
}
