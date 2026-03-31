import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { MailService } from '../../mail/mail.service';
import { LoggingService } from '../../logging/logging.service';
import { EmailJob } from '../email-queue.service';

@Processor('email')
export class EmailProcessor {
  constructor(
    private mailService: MailService,
    private loggingService: LoggingService,
  ) {}

  @Process('send-email')
  async handleSendEmail(job: Job<EmailJob>) {
    const { type, to, data } = job.data;

    try {
      switch (type) {
        case 'verification':
          await this.mailService.sendVerificationEmail(
            to,
            data.fullName,
            data.token!,
          );
          break;

        case 'welcome':
          await this.mailService.sendWelcomeEmail(to, data.fullName);
          break;

        case 'password-reset':
          await this.mailService.sendPasswordResetEmail(
            to,
            data.fullName,
            data.token!,
          );
          break;

        case 'password-changed':
          await this.mailService.sendPasswordChangedEmail(to, data.fullName);
          break;

        default:
          throw new Error(`Unknown email type: ${type}`);
      }

      this.loggingService.log(
        `Email sent successfully: ${type} to ${to}`,
        'EmailProcessor',
      );
    } catch (error) {
      this.loggingService.error(
        `Failed to send ${type} email to ${to}`,
        error.stack,
        'EmailProcessor',
      );
      throw error; // Retry
    }
  }
}
