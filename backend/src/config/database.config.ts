import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs('database', (): TypeOrmModuleOptions => {
  const url = process.env.DATABASE_URL;
  const useSSL =
    process.env.DATABASE_SSL === 'true' ||
    (url ? /sslmode=(require|verify)/.test(url) : false);

  const connection: Partial<TypeOrmModuleOptions> = url
    ? { url }
    : {
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432', 10),
        username: process.env.DATABASE_USER || 'postgres',
        password: process.env.DATABASE_PASSWORD || 'postgres',
        database: process.env.DATABASE_NAME || 'linvnix',
      };

  return {
    type: 'postgres',
    ...(connection as object),
    ssl: useSSL ? { rejectUnauthorized: false } : false,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    synchronize:
      process.env.DATABASE_SYNCHRONIZE === 'true' ||
      process.env.NODE_ENV === 'development',
    logging: process.env.NODE_ENV === 'development',
    autoLoadEntities: true,
  } as TypeOrmModuleOptions;
});
