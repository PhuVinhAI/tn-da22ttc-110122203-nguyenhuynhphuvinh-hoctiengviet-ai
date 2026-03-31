import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
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
import { EmailVerificationToken } from './domain/email-verification-token.entity';
import { PasswordResetToken } from './domain/password-reset-token.entity';
import { RefreshToken } from './domain/refresh-token.entity';
import { Role } from './domain/role.entity';
import { Role as RoleEnum } from '../../common/enums';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private loggingService: LoggingService,
    private emailQueueService: EmailQueueService,
    @InjectRepository(EmailVerificationToken)
    private emailVerificationTokenRepository: Repository<EmailVerificationToken>,
    @InjectRepository(PasswordResetToken)
    private passwordResetTokenRepository: Repository<PasswordResetToken>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async register(registerDto: RegisterDto, userAgent?: string, ipAddress?: string) {
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
      const verificationToken = await this.createEmailVerificationToken(user.id);
      
      // Gửi email xác thực
      await this.emailQueueService.sendVerificationEmail(
        user.email,
        user.fullName,
        verificationToken.token,
      );

      const tokens = await this.generateTokens(user.id, user.email, userAgent, ipAddress);
      
      this.loggingService.log(
        `User registered: ${user.email}`,
        'AuthService',
      );
      
      return {
        user,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_in: 900, // 15 minutes in seconds
        message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.',
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

      const tokens = await this.generateTokens(user.id, user.email, userAgent, ipAddress);
      
      this.loggingService.log(
        `User logged in: ${user.email}`,
        'AuthService',
      );
      
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

    const verificationToken = await this.emailVerificationTokenRepository.findOne({
      where: { token, verifiedAt: null as any },
      relations: ['user'],
    });

    if (!verificationToken) {
      throw new BadRequestException('Token không hợp lệ hoặc đã được sử dụng');
    }

    if (verificationToken.expiresAt < new Date()) {
      throw new BadRequestException('Token đã hết hạn');
    }

    // Cập nhật user
    await this.usersService.update(verificationToken.userId, {
      emailVerified: true,
      emailVerifiedAt: new Date(),
    } as any);

    // Đánh dấu token đã sử dụng
    verificationToken.verifiedAt = new Date();
    await this.emailVerificationTokenRepository.save(verificationToken);

    // Gửi welcome email
    await this.emailQueueService.sendWelcomeEmail(
      verificationToken.user.email,
      verificationToken.user.fullName,
    );

    this.loggingService.log(
      `Email verified: ${verificationToken.user.email}`,
      'AuthService',
    );

    return {
      message: 'Email đã được xác thực thành công!',
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Không tiết lộ email có tồn tại hay không
      return {
        message: 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu.',
      };
    }

    // Xóa các token cũ chưa sử dụng
    await this.passwordResetTokenRepository.delete({
      userId: user.id,
      usedAt: null as any,
    });

    // Tạo token mới
    const resetToken = await this.createPasswordResetToken(user.id);

    // Gửi email
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

    const resetToken = await this.passwordResetTokenRepository.findOne({
      where: { token, usedAt: null as any },
      relations: ['user'],
    });

    if (!resetToken) {
      throw new BadRequestException('Token không hợp lệ hoặc đã được sử dụng');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Token đã hết hạn');
    }

    // Cập nhật mật khẩu
    await this.usersService.update(resetToken.userId, {
      password: newPassword,
    } as any);

    // Đánh dấu token đã sử dụng
    resetToken.usedAt = new Date();
    await this.passwordResetTokenRepository.save(resetToken);

    // Gửi email thông báo
    await this.emailQueueService.sendPasswordChangedEmail(
      resetToken.user.email,
      resetToken.user.fullName,
    );

    this.loggingService.log(
      `Password reset completed: ${resetToken.user.email}`,
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

    // Xóa token cũ
    await this.emailVerificationTokenRepository.delete({
      userId: user.id,
      verifiedAt: null as any,
    });

    // Tạo token mới
    const verificationToken = await this.createEmailVerificationToken(user.id);

    // Gửi lại email
    await this.emailQueueService.sendVerificationEmail(
      user.email,
      user.fullName,
      verificationToken.token,
    );

    return {
      message: 'Email xác thực đã được gửi lại!',
    };
  }

  private async createEmailVerificationToken(userId: string): Promise<EmailVerificationToken> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 giờ

    const verificationToken = this.emailVerificationTokenRepository.create({
      token,
      userId,
      expiresAt,
    });

    return this.emailVerificationTokenRepository.save(verificationToken);
  }

  private async createPasswordResetToken(userId: string): Promise<PasswordResetToken> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 giờ

    const resetToken = this.passwordResetTokenRepository.create({
      token,
      userId,
      expiresAt,
    });

    return this.passwordResetTokenRepository.save(resetToken);
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
    const expiresIn = this.configService.get<string>('jwt.accessTokenExpiresIn') || '15m';
    const accessToken = this.jwtService.sign(payload, {
      expiresIn,
    } as any);

    // Generate refresh token (long-lived)
    const refreshTokenValue = randomBytes(64).toString('hex');
    const refreshTokenExpiresIn = this.configService.get<string>('jwt.refreshTokenExpiresIn') || '7d';
    
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

  // Cleanup expired tokens (có thể chạy bằng cron job)
  async cleanupExpiredTokens() {
    const now = new Date();
    
    await this.emailVerificationTokenRepository.delete({
      expiresAt: LessThan(now),
    });

    await this.passwordResetTokenRepository.delete({
      expiresAt: LessThan(now),
    });

    // Cleanup expired refresh tokens
    await this.refreshTokenRepository.delete({
      expiresAt: LessThan(now),
    });

    this.loggingService.log('Expired tokens cleaned up', 'AuthService');
  }

  // OAuth methods
  async validateOAuthUser(oauthUser: OAuthUserDto) {
    const { googleId, email, fullName, avatarUrl, provider } = oauthUser;

    // Tìm user theo googleId hoặc email
    let user = googleId ? await this.usersService.findByGoogleId(googleId) : null;
    
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
    await this.emailQueueService.sendWelcomeEmail(newUser.email, newUser.fullName);

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

    // Find refresh token
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token: tokenValue },
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
