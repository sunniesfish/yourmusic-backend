import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { User } from '../user/entities/user.entity';
import { Playlist } from '../playlist/entities/playlist.entity';
import { Statistic } from '../statistic/entities/statistic.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { SpotifyToken } from '../auth/entities/spotify-token.entity';
import { YoutubeCredentials } from '../auth/entities/youtube-token.entity';

config({ path: '/secrets/.env' });

const configService = new ConfigService();

export default new DataSource({
  type: 'mysql',
  host: configService.get('DB_HOST'),
  port: configService.get('DB_PORT'),
  username: configService.get('DB_USERNAME'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_DATABASE'),
  entities: [
    User,
    Playlist,
    Statistic,
    RefreshToken,
    SpotifyToken,
    YoutubeCredentials,
  ],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
  logging: configService.get('NODE_ENV') !== 'production',
});
