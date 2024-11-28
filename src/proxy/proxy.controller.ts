import { Controller, Req } from '@nestjs/common';

import { Get } from '@nestjs/common';
import { ProxyService } from './proxy.service';

@Controller('api')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @Get('spotify/*')
  async spotifyProxy(@Req() req: Request, @User() user: UserEntity) {
    return this.proxyService.forwardRequest(user.id, 'spotify', {
      method: 'GET',
      path: req.path.replace('/api/spotify', ''),
      params: req.query,
    });
  }

  @Get('youtube/*')
  async youtubeProxy(@Req() req: Request, @User() user: UserEntity) {
    return this.proxyService.forwardRequest(user.id, 'youtube', {
      method: 'GET',
      path: req.path.replace('/api/youtube', ''),
      params: req.query,
    });
  }
}
