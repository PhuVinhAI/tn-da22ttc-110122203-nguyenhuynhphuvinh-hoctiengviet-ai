#!/usr/bin/env ts-node

import { DataSource } from 'typeorm';

async function bootstrap() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'linvnix',
    synchronize: false,
  });

  try {
    await dataSource.initialize();

    const users = await dataSource.query(
      `SELECT id, email, role, email_verified, full_name, created_at
       FROM users
       WHERE email = $1`,
      ['admin@linvnix.test']
    );

    console.log('Admin user data:');
    console.log(JSON.stringify(users, null, 2));

    await dataSource.destroy();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

bootstrap();
