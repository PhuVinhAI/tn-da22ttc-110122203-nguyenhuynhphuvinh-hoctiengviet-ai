#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/modules/users/application/users.service';
import { Role } from '../src/common/enums';

async function bootstrap() {
  console.log('Creating Admin User...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  try {
    const email = 'admin@linvnix.test';
    const password = 'Str0ng!Boss2026';
    const fullName = 'Admin User';

    const existingUser = await usersService.findByEmail(email);
    if (existingUser) {
      if (existingUser.role !== Role.ADMIN || !existingUser.emailVerified) {
        await usersService.update(existingUser.id, {
          role: Role.ADMIN,
          emailVerified: true,
          emailVerifiedAt: new Date(),
        } as any);
      }

      console.log('Admin user already exists.');
      console.log('\nUser Details:');
      console.log(`  Email: ${email}`);
      console.log(`  Name: ${fullName}`);
      console.log('  Role: ADMIN');
      await app.close();
      return;
    }

    await usersService.create({
      email,
      password,
      fullName,
      nativeLanguage: 'Vietnamese',
      role: Role.ADMIN,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });

    console.log('\nAdmin user created successfully.');
    console.log('\nUser Details:');
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);
    console.log(`  Name: ${fullName}`);
    console.log('  Role: ADMIN');
    console.log('  Email Verified: Yes');
  } catch (error) {
    console.error('Error creating admin user:', error.message);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
