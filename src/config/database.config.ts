import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'mysql',
    host:
      process.env.NODE_ENV !== 'production'
        ? process.env.DB_HOST_DEV
        : process.env.DB_HOST,
    port:
      process.env.NODE_ENV !== 'production'
        ? parseInt(process.env.DB_PORT_DEV)
        : parseInt(process.env.DB_PORT),
    username:
      process.env.NODE_ENV !== 'production'
        ? process.env.DB_USERNAME_DEV
        : process.env.DB_USERNAME,
    password:
      process.env.NODE_ENV !== 'production'
        ? process.env.DB_PASSWORD_DEV
        : process.env.DB_PASSWORD,
    database:
      process.env.NODE_ENV !== 'production'
        ? process.env.DB_DATABASE_DEV
        : process.env.DB_DATABASE,
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV !== 'production',
  }),
);
