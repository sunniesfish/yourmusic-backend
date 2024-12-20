import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { YoutubeCredentials } from '../entities/youtube-token.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class GoogleAuthService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(YoutubeCredentials)
    private readonly youtubeCredentialsRepository: Repository<YoutubeCredentials>,
  ) {}

  private createOAuthClient(): OAuth2Client {
    return new OAuth2Client(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_CLIENT_SECRET'),
      this.configService.get('GOOGLE_REDIRECT_URI'),
    );
  }

  async getOAuthClientForUser(userId: string): Promise<OAuth2Client> {
    const oauth2Client = this.createOAuthClient();
    const credentials = await this.getUserTokens(userId);
    if (credentials) {
      oauth2Client.setCredentials(credentials);
    }
    return oauth2Client;
  }

  private async getUserTokens(
    userId: string,
  ): Promise<YoutubeCredentials | null> {
    const youtubeCredentials = await this.youtubeCredentialsRepository.findOne({
      where: { userId },
    });
    return youtubeCredentials ? youtubeCredentials : null;
  }

  getAuthUrl(): string {
    const oauth2Client = this.createOAuthClient();
    const scopes = ['https://www.googleapis.com/auth/youtube'];
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
    });
  }

  async getToken(code: string, userId: string) {
    const oauth2Client = this.createOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    await this.youtubeCredentialsRepository.save({
      userId,
      ...tokens,
    });
    return tokens;
  }
}
