import { SetMetadata } from '@nestjs/common';

export const YOUTUBE_AUTH_KEY = 'YOUTUBE_AUTH';

export interface YouTubeAuthOptions {
  required?: boolean;
}

export const YouTubeAuth = (options: YouTubeAuthOptions = { required: true }) =>
  SetMetadata(YOUTUBE_AUTH_KEY, options);
