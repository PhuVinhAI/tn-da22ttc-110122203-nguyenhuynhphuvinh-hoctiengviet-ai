#!/usr/bin/env ts-node

/**
 * Script để tạo admin user đầu tiên
 * Usage: bun run scripts/create-admin.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/modules/users/application/users.service';
import { Repository } from 'typeorm';
import { Role } from '../src/modules/auth/domain/role.entity';
import { Role as RoleEnum } from '../src/common/enums';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function bootstrap() {
  console.log('🚀 Creating Admin User...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const roleRepository: Repository<Role> = app.get(getRepositoryToken(Role));

  try {
    // Get admin role
    const adminRole = await roleRepository.findOne({
      where: { name: RoleEnum.ADMIN },
    });

    if (!adminRole) {
      console.error('❌ Admin role not found! Please run the app first to seed roles.');
      process.exit(1);
    }

    // Get user input
    const email = await question('Email: ');
    const password = await question('Password (min 8 chars): ');
    const fullName = await question('Full Name: ');

    if (!email || !password || !fullName) {
      console.error('❌ All fields are required!');
      process.exit(1);
    }

    if (password.length < 8) {
      console.error('❌ Password must be at least 8 characters!');
      process.exit(1);
    }

    // Check if user exists
    const existingUser = await usersService.findByEmail(email);
    if (existingUser) {
      console.error('❌ User with this email already exists!');
      process.exit(1);
    }

    // Create admin user
    const user = await usersService.create({
      email,
      password,
      fullName,
      nativeLanguage: 'Vietnamese',
    });

    // Assign admin role
    user.roles = [adminRole];
    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    await usersService.update(user.id, user as any);

    console.log('\n✅ Admin user created successfully!');
    console.log('\nUser Details:');
    console.log(`  Email: ${email}`);
    console.log(`  Name: ${fullName}`);
    console.log(`  Role: ADMIN`);
    console.log(`  Email Verified: Yes`);
    console.log('\n🎉 You can now login with these credentials!');
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await app.close();
  }
}

bootstrap();
