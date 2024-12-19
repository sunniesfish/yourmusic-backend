import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class GoogleAuthService {
  private readonly oauthClient: OAuth2Client;
  constructor(private readonly configService: ConfigService) {
    this.oauthClient = new OAuth2Client(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_CLIENT_SECRET'),
      this.configService.get('GOOGLE_REDIRECT_URI'),
    );
  }

  getAuthUrl() {
    const scopes = ['https://www.googleapis.com/auth/youtube'];
    const url = this.oauthClient.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
    });
    return url;
  }

  async getAccessToken(code: string) {
    const { tokens } = await this.oauthClient.getToken(code);
    return tokens;
  }
}
