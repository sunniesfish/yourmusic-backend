export interface GoogleAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

const googleAuthConfig: GoogleAuthConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: process.env.GOOGLE_REDIRECT_URI!,
};

export const googleAuthConfigService = {
  getConfig: () => googleAuthConfig,
};
