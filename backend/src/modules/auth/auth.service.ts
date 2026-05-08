import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { UsersService } from '../users/application/users.service';
import { LoggingService } from '../../infrastructure/logging/logging.service';
import { EmailQueueService } from '../../infrastructure/queue/email-queue.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { OAuthUserDto } from './dto/oauth-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RefreshToken } from './domain/refresh-token.entity';
import { Role } from './domain/role.entity';
import { Role as RoleEnum } from '../../common/enums';
import { TokenLifecycle } from './token-lifecycle/token-lifecycle.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private loggingService: LoggingService,
    private emailQueueService: EmailQueueService,
    private tokenLifecycle: TokenLifecycle,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async register(
    registerDto: RegisterDto,
    userAgent?: string,
    ipAddress?: string,
  ) {
    try {
      // Tạo user mới
      const user = await this.usersService.create(registerDto);

      // Assign USER role mặc định
      const userRole = await this.roleRepository.findOne({
        where: { name: RoleEnum.USER },
      });

      if (userRole) {
        // Không dùng update, dùng save trực tiếp
        user.roles = [userRole];
        await this.usersService.save(user);
      }

      // Tạo verification token
      const verificationToken =
        await this.tokenLifecycle.createVerificationToken(user.id);

      await this.emailQueueService.sendVerificationEmail(
        user.email,
        user.fullName,
        verificationToken.token,
      );

      const tokens = await this.generateTokens(
        user.id,
        user.email,
        userAgent,
        ipAddress,
      );

      this.loggingService.log(`User registered: ${user.email}`, 'AuthService');

      return {
        user,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_in: 900, // 15 minutes in seconds
        message:
          'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.',
      };
    } catch (error) {
      this.loggingService.error(
        `Registration failed: ${registerDto.email}`,
        error.stack,
        'AuthService',
      );
      throw error;
    }
  }

  async login(loginDto: LoginDto, userAgent?: string, ipAddress?: string) {
    try {
      const user = await this.usersService.findByEmail(loginDto.email);
      if (!user) {
        this.loggingService.warn(
          `Login attempt with non-existent email: ${loginDto.email}`,
          'AuthService',
        );
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await this.usersService.validatePassword(
        loginDto.password,
        user.password,
      );

      if (!isPasswordValid) {
        this.loggingService.warn(
          `Failed login attempt for user: ${loginDto.email}`,
          'AuthService',
        );
        throw new UnauthorizedException('Invalid credentials');
      }

      const tokens = await this.generateTokens(
        user.id,
        user.email,
        userAgent,
        ipAddress,
      );

      this.loggingService.log(`User logged in: ${user.email}`, 'AuthService');

      return {
        user,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_in: 900, // 15 minutes in seconds
      };
    } catch (error) {
      if (!(error instanceof UnauthorizedException)) {
        this.loggingService.error(
          `Login error: ${loginDto.email}`,
          error.stack,
          'AuthService',
        );
      }
      throw error;
    }
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const { token } = verifyEmailDto;

    const result = await this.tokenLifecycle.verifyEmailToken(token);

    if (!result) {
      throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn');
    }

    await this.usersService.update(result.userId, {
      emailVerified: true,
      emailVerifiedAt: new Date(),
    } as any);

    await this.emailQueueService.sendWelcomeEmail(
      result.email,
      result.fullName,
    );

    this.loggingService.log(`Email verified: ${result.email}`, 'AuthService');

    return {
      message: 'Email đã được xác thực thành công!',
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return {
        message: 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu.',
      };
    }

    const resetToken = await this.tokenLifecycle.createPasswordResetToken(
      user.id,
    );

    await this.emailQueueService.sendPasswordResetEmail(
      user.email,
      user.fullName,
      resetToken.token,
    );

    this.loggingService.log(
      `Password reset requested: ${email}`,
      'AuthService',
    );

    return {
      message: 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    const result = await this.tokenLifecycle.verifyPasswordResetToken(token);

    if (!result) {
      throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn');
    }

    await this.usersService.update(result.userId, {
      password: newPassword,
    } as any);

    const user = await this.usersService.findById(result.userId);

    await this.emailQueueService.sendPasswordChangedEmail(
      result.email,
      user?.fullName ?? '',
    );

    this.loggingService.log(
      `Password reset completed: ${result.email}`,
      'AuthService',
    );

    return {
      message: 'Mật khẩu đã được đặt lại thành công!',
    };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email đã được xác thực');
    }

    const verificationToken = await this.tokenLifecycle.createVerificationToken(
      user.id,
    );

    await this.emailQueueService.sendVerificationEmail(
      user.email,
      user.fullName,
      verificationToken.token,
    );

    return {
      message: 'Email xác thực đã được gửi lại!',
    };
  }

  private generateToken(userId: string, email: string): string {
    const payload = { sub: userId, email };
    return this.jwtService.sign(payload);
  }

  private async generateTokens(
    userId: string,
    email: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: userId, email };

    // Generate access token (short-lived)
    const expiresIn =
      this.configService.get<string>('jwt.accessTokenExpiresIn') || '15m';
    const accessToken = this.jwtService.sign(payload, {
      expiresIn,
    } as any);

    // Generate refresh token (long-lived)
    const refreshTokenValue = randomBytes(64).toString('hex');
    const refreshTokenExpiresIn =
      this.configService.get<string>('jwt.refreshTokenExpiresIn') || '7d';

    // Calculate expiration date
    const expiresAt = new Date();
    const days = parseInt(refreshTokenExpiresIn.replace('d', ''));
    expiresAt.setDate(expiresAt.getDate() + days);

    // Save refresh token to database
    const refreshToken = this.refreshTokenRepository.create({
      token: refreshTokenValue,
      userId,
      expiresAt,
      userAgent,
      ipAddress,
    });

    await this.refreshTokenRepository.save(refreshToken);

    return {
      accessToken,
      refreshToken: refreshTokenValue,
    };
  }

  async cleanupExpiredTokens() {
    const now = new Date();

    const lifecycleResult = await this.tokenLifecycle.cleanupExpired();

    const refreshResult = await this.refreshTokenRepository.delete({
      expiresAt: LessThan(now),
    });

    this.loggingService.log('Expired tokens cleaned up', 'AuthService');

    return {
      verificationTokensRemoved: lifecycleResult.verificationTokensRemoved,
      passwordResetTokensRemoved: lifecycleResult.passwordResetTokensRemoved,
      refreshTokensRemoved: refreshResult.affected ?? 0,
    };
  }

  // OAuth methods
  async validateOAuthUser(oauthUser: OAuthUserDto) {
    const { googleId, email, fullName, avatarUrl, provider } = oauthUser;

    // Tìm user theo googleId hoặc email
    let user = googleId
      ? await this.usersService.findByGoogleId(googleId)
      : null;

    if (!user) {
      user = await this.usersService.findByEmail(email);
    }

    if (user) {
      // Cập nhật thông tin nếu user đã tồn tại
      if (!user.googleId && googleId) {
        await this.usersService.update(user.id, {
          googleId,
          provider,
          avatarUrl: avatarUrl || user.avatarUrl,
          emailVerified: true,
          emailVerifiedAt: new Date(),
        } as any);
      }
      return user;
    }

    // Tạo user mới từ Google
    const newUser = await this.usersService.createOAuthUser({
      email,
      fullName,
      googleId,
      provider,
      avatarUrl,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });

    // Assign USER role
    const userRole = await this.roleRepository.findOne({
      where: { name: RoleEnum.USER },
    });

    if (userRole) {
      newUser.roles = [userRole];
      await this.usersService.save(newUser);
    }

    // Gửi welcome email
    await this.emailQueueService.sendWelcomeEmail(
      newUser.email,
      newUser.fullName,
    );

    this.loggingService.log(
      `New OAuth user created: ${newUser.email}`,
      'AuthService',
    );

    return newUser;
  }

  async loginWithGoogle(user: any) {
    const token = this.generateToken(user.id, user.email);

    this.loggingService.log(
      `User logged in via Google: ${user.email}`,
      'AuthService',
    );

    return {
      user,
      access_token: token,
    };
  }

  // Refresh Token Methods
  async refreshAccessToken(
    refreshTokenDto: RefreshTokenDto,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const { refreshToken: tokenValue } = refreshTokenDto;

    // Find refresh token (only non-revoked)
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token: tokenValue, revokedAt: null as any },
      relations: ['user'],
    });

    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Validate token
    if (!refreshToken.isValid()) {
      throw new UnauthorizedException('Refresh token expired or revoked');
    }

    // Revoke old token (token rotation)
    refreshToken.revokedAt = new Date();
    await this.refreshTokenRepository.save(refreshToken);

    // Generate new tokens
    const tokens = await this.generateTokens(
      refreshToken.userId,
      refreshToken.user.email,
      userAgent,
      ipAddress,
    );

    this.loggingService.log(
      `Access token refreshed for user: ${refreshToken.user.email}`,
      'AuthService',
    );

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_in: 900, // 15 minutes
    };
  }

  async logout(refreshTokenDto: RefreshTokenDto, userId: string) {
    const { refreshToken: tokenValue } = refreshTokenDto;

    // Find and revoke refresh token
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token: tokenValue, userId },
    });

    if (refreshToken && !refreshToken.isRevoked()) {
      refreshToken.revokedAt = new Date();
      await this.refreshTokenRepository.save(refreshToken);
    }

    this.loggingService.log(`User logged out: ${userId}`, 'AuthService');

    return {
      message: 'Đăng xuất thành công',
    };
  }

  async revokeAllUserTokens(userId: string) {
    await this.refreshTokenRepository.update(
      { userId, revokedAt: null as any },
      { revokedAt: new Date() },
    );

    this.loggingService.log(
      `All tokens revoked for user: ${userId}`,
      'AuthService',
    );
  }
}
