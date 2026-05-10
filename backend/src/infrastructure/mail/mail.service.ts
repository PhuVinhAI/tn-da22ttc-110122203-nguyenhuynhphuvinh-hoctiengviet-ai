import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { LoggingService } from '../logging/logging.service';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private loggingService: LoggingService,
  ) {}

  async sendVerificationEmail(
    email: string,
    fullName: string,
    token: string,
    code?: string,
  ) {
    // Skip sending email if configured (useful for testing)
    if (process.env.SKIP_MAIL_SENDING === 'true') {
      this.loggingService.log(
        `[SKIPPED] Verification email for: ${email}`,
        'MailService',
      );
      return;
    }

    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Xác thực email của bạn',
        template: 'verification',
        context: {
          fullName,
          verificationUrl,
          code: code || '',
        },
      });

      this.loggingService.log(
        `Verification email sent to: ${email}`,
        'MailService',
      );
    } catch (error) {
      this.loggingService.error(
        `Failed to send verification email to: ${email}`,
        error.stack,
        'MailService',
      );
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, fullName: string) {
    // Skip sending email if configured (useful for testing)
    if (process.env.SKIP_MAIL_SENDING === 'true') {
      this.loggingService.log(
        `[SKIPPED] Welcome email for: ${email}`,
        'MailService',
      );
      return;
    }

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Chào mừng bạn đến với ứng dụng học tiếng Đức!',
        template: 'welcome',
        context: {
          fullName,
          loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`,
        },
      });

      this.loggingService.log(`Welcome email sent to: ${email}`, 'MailService');
    } catch (error) {
      this.loggingService.error(
        `Failed to send welcome email to: ${email}`,
        error.stack,
        'MailService',
      );
    }
  }

  async sendPasswordResetEmail(
    email: string,
    fullName: string,
    token: string,
    code?: string,
  ) {
    // Skip sending email if configured (useful for testing)
    if (process.env.SKIP_MAIL_SENDING === 'true') {
      this.loggingService.log(
        `[SKIPPED] Password reset email for: ${email}`,
        'MailService',
      );
      return;
    }

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Đặt lại mật khẩu của bạn',
        template: 'password-reset',
        context: {
          fullName,
          code: code || '',
          expiresIn: '15 phút',
        },
      });

      this.loggingService.log(
        `Password reset email sent to: ${email}`,
        'MailService',
      );
    } catch (error) {
      this.loggingService.error(
        `Failed to send password reset email to: ${email}`,
        error.stack,
        'MailService',
      );
      throw error;
    }
  }

  async sendPasswordChangedEmail(email: string, fullName: string) {
    // Skip sending email if configured (useful for testing)
    if (process.env.SKIP_MAIL_SENDING === 'true') {
      this.loggingService.log(
        `[SKIPPED] Password changed email for: ${email}`,
        'MailService',
      );
      return;
    }

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Mật khẩu của bạn đã được thay đổi',
        template: 'password-changed',
        context: {
          fullName,
          supportUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/support`,
        },
      });

      this.loggingService.log(
        `Password changed notification sent to: ${email}`,
        'MailService',
      );
    } catch (error) {
      this.loggingService.error(
        `Failed to send password changed email to: ${email}`,
        error.stack,
        'MailService',
      );
    }
  }
}
