import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';
import { UsersModule } from '../users/users.module';
import { QueueModule } from '../../infrastructure/queue/queue.module';
import { TokenLifecycleModule } from './token-lifecycle/token-lifecycle.module';
import { RefreshToken } from './domain/refresh-token.entity';

@Module({
  imports: [
    UsersModule,
    QueueModule,
    TokenLifecycleModule,
    PassportModule,
    TypeOrmModule.forFeature([RefreshToken]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('jwt.secret');
        if (!secret) {
          throw new Error('jwt.secret is missing — check JWT_SECRET env var');
        }
        const expiresIn =
          configService.get<string>('jwt.accessTokenExpiresIn') || '15m';
        return {
          secret,
          signOptions: { expiresIn } as any,
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
  ],
  exports: [AuthService, JwtAuthGuard, OptionalJwtAuthGuard],
})
export class AuthModule {}
