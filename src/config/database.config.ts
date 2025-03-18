import { registerAs } from '@nestjs/config/dist/utils/register-as.util';
import { TypeOrmModuleOptions } from '@nestjs/typeorm/dist/interfaces/typeorm-options.interface';

export default registerAs('database', (): TypeOrmModuleOptions => {
  if (process.env.NODE_ENV === 'production') {
    return {
      type: 'mysql',
      host: 'localhost',
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      synchronize: false,
      logging: false,
      extra: {
        socketPath: `/cloudsql/${process.env.DB_HOST}`,
      },
    };
  } else {
    return {
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      synchronize: true,
      logging: true,
    };
  }
});
