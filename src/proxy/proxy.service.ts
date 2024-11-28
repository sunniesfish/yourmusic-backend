import { Injectable } from '@nestjs/common';

@Injectable()
export class ProxyService {
  constructor(
    private readonly authService: AuthService,
    private readonly httpService: HttpService,
  ) {}

  async forwardRequest(
    userId: string,
    service: 'spotify' | 'youtube',
    config: {
      method: string;
      path: string;
      data?: any;
      params?: any;
    },
  ) {
    const token = await this.authService.getValidToken(userId, service);
    const baseURL = this.getServiceBaseURL(service);

    try {
      const response = await this.httpService
        .request({
          method: config.method,
          url: `${baseURL}${config.path}`,
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: config.data,
          params: config.params,
        })
        .toPromise();

      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        // 토큰 만료 시 자동 갱신
        await this.authService.refreshToken(userId, service);
        return this.forwardRequest(userId, service, config);
      }
      throw error;
    }
  }

  private getServiceBaseURL(service: 'spotify' | 'youtube'): string {
    return service === 'spotify'
      ? 'https://api.spotify.com/v1'
      : 'https://www.googleapis.com/youtube/v3';
  }
}
