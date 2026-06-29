#!/usr/bin/env ts-node

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  console.log('Creating Admin User...\n');

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
    console.log('Database connected successfully\n');

    const email = 'admin@linvnix.test';
    const password = 'Str0ng!Boss2026';
    const fullName = 'Admin User';

    // Check if user exists
    const existingUser = await dataSource.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.length > 0) {
      // Update existing user to admin
      await dataSource.query(
        `UPDATE users
         SET role = $1, email_verified = $2, email_verified_at = $3
         WHERE email = $4`,
        ['ADMIN', true, new Date(), email]
      );

      console.log('Admin user already exists and has been updated.');
      console.log('\nUser Details:');
      console.log(`  Email: ${email}`);
      console.log(`  Name: ${fullName}`);
      console.log('  Role: ADMIN');
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash(password, 10);

      await dataSource.query(
        `INSERT INTO users (id, email, password, full_name, native_language, role, email_verified, email_verified_at, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [email, hashedPassword, fullName, 'Vietnamese', 'ADMIN', true, new Date()]
      );

      console.log('Admin user created successfully.');
      console.log('\nUser Details:');
      console.log(`  Email: ${email}`);
      console.log(`  Password: ${password}`);
      console.log(`  Name: ${fullName}`);
      console.log('  Role: ADMIN');
      console.log('  Email Verified: Yes');
    }

    await dataSource.destroy();
  } catch (error) {
    console.error('Error creating admin user:', error.message);
    process.exit(1);
  }
}

bootstrap();
