import { ConfigService } from '@nestjs/config';

export interface GoogleAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export function createGoogleAuthConfig(
  configService: ConfigService,
): GoogleAuthConfig {
  const config = {
    clientId: configService.get<string>('GOOGLE_CLIENT_ID'),
    clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
    redirectUri: configService.get<string>('GOOGLE_REDIRECT_URI'),
  };

  if (!config.clientId || !config.clientSecret || !config.redirectUri) {
    throw new Error('Missing required Google OAuth configuration');
  }

  return config;
}
