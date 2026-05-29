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

    // Fixed credentials for testing
    const email = 'admin@linvnix.test';
    const password = 'Str0ng!Boss2026';
    const fullName = 'Admin User';

    // Check if user exists
    const existingUser = await usersService.findByEmail(email);
    if (existingUser) {
      console.log('✅ Admin user already exists!');
      console.log('\nUser Details:');
      console.log(`  Email: ${email}`);
      console.log(`  Name: ${fullName}`);
      console.log(`  Role: ADMIN`);
      console.log('\n🎉 You can now login with these credentials!');
      await app.close();
      return;
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
    await usersService.save(user);

    console.log('\n✅ Admin user created successfully!');
    console.log('\nUser Details:');
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);
    console.log(`  Name: ${fullName}`);
    console.log(`  Role: ADMIN`);
    console.log(`  Email Verified: Yes`);
    console.log('\n🎉 You can now login with these credentials!');
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
