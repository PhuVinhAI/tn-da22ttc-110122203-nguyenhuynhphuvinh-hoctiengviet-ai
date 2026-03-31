import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { UsersService } from '../users/application/users.service';
import { LoggingService } from '../../infrastructure/logging/logging.service';
import { MailService } from '../../infrastructure/mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { OAuthUserDto } from './dto/oauth-user.dto';
import { EmailVerificationToken } from './domain/email-verification-token.entity';
import { PasswordResetToken } from './domain/password-reset-token.entity';
import { Role } from './domain/role.entity';
import { Role as RoleEnum } from '../../common/enums';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private loggingService: LoggingService,
    private mailService: MailService,
    @InjectRepository(EmailVerificationToken)
    private emailVerificationTokenRepository: Repository<EmailVerificationToken>,
    @InjectRepository(PasswordResetToken)
    private passwordResetTokenRepository: Repository<PasswordResetToken>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async register(registerDto: RegisterDto) {
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
      await this.mailService.sendVerificationEmail(
        user.email,
        user.fullName,
        verificationToken.token,
      );

      const token = this.generateToken(user.id, user.email);
      
      this.loggingService.log(
        `User registered: ${user.email}`,
        'AuthService',
      );
      
      return {
        user,
        access_token: token,
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

  async login(loginDto: LoginDto) {
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

      const token = this.generateToken(user.id, user.email);
      
      this.loggingService.log(
        `User logged in: ${user.email}`,
        'AuthService',
      );
      
      return {
        user,
        access_token: token,
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
    await this.mailService.sendWelcomeEmail(
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
    await this.mailService.sendPasswordResetEmail(
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
    await this.mailService.sendPasswordChangedEmail(
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
    await this.mailService.sendVerificationEmail(
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

  // Cleanup expired tokens (có thể chạy bằng cron job)
  async cleanupExpiredTokens() {
    const now = new Date();
    
    await this.emailVerificationTokenRepository.delete({
      expiresAt: LessThan(now),
    });

    await this.passwordResetTokenRepository.delete({
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
    await this.mailService.sendWelcomeEmail(newUser.email, newUser.fullName);

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
}
