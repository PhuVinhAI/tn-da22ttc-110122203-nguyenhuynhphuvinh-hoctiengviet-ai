import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { UsersModule } from '../users/users.module';
import { QueueModule } from '../../infrastructure/queue/queue.module';
import { Role } from './domain/role.entity';
import { Permission } from './domain/permission.entity';
import { EmailVerificationToken } from './domain/email-verification-token.entity';
import { PasswordResetToken } from './domain/password-reset-token.entity';
import { RefreshToken } from './domain/refresh-token.entity';
import { RbacService } from './application/rbac.service';

@Module({
  imports: [
    UsersModule,
    QueueModule,
    PassportModule,
    TypeOrmModule.forFeature([
      Role,
      Permission,
      EmailVerificationToken,
      PasswordResetToken,
      RefreshToken,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('jwt.secret') || 'default-secret';
        const expiresIn = configService.get<string>('jwt.accessTokenExpiresIn') || '15m';
        return {
          secret,
          signOptions: { expiresIn } as any,
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, RbacService],
  exports: [AuthService, RbacService],
})
export class AuthModule {}
