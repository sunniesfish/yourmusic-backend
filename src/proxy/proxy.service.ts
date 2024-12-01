import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AuthService } from 'src/auth/service/auth.service';

@Injectable()
export class ProxyService {
  constructor(
    private readonly authService: AuthService,
    private readonly httpService: HttpService,
  ) {}
}
