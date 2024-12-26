export class SpotifyAuthService {
  private readonly config = {
    clientId: 'YOUR_CLIENT_ID',
    clientSecret: 'YOUR_CLIENT_SECRET',
    redirectUri: 'YOUR_REDIRECT_URI',
    authEndpoint: 'https://accounts.spotify.com/authorize',
    tokenEndpoint: 'https://accounts.spotify.com/api/token',
    scopes: [
      'playlist-read-private',
      'playlist-modify-public',
      'playlist-modify-private',
    ],
  };

  // 1. 인증 URL 생성
  getAuthUrl(): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      scope: this.config.scopes.join(' '),
      redirect_uri: this.config.redirectUri,
    });
    return `${this.config.authEndpoint}?${params.toString()}`;
  }

  // 2. 인증 코드로 액세스 토큰 교환
  async getAccessToken(code: string): Promise<{
    access_token: string;
    refresh_token: string;
  }> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.config.redirectUri,
    });

    const response = await fetch(this.config.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${this.config.clientId}:${this.config.clientSecret}`,
        ).toString('base64')}`,
      },
      body: params.toString(),
    });

    return response.json();
  }

  // 3. 리프레시 토큰으로 새 액세스 토큰 발급
  async refreshToken(refreshToken: string): Promise<{
    access_token: string;
  }> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    const response = await fetch(this.config.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${this.config.clientId}:${this.config.clientSecret}`,
        ).toString('base64')}`,
      },
      body: params.toString(),
    });

    return response.json();
  }
}
