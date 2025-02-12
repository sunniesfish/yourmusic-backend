import { registerEnumType } from '@nestjs/graphql';

export enum ApiDomain {
  SPOTIFY = 'spotify',
  YOUTUBE = 'youtube',
}

registerEnumType(ApiDomain, {
  name: 'ApiDomain',
  description: 'Enum for the API domain',
});
