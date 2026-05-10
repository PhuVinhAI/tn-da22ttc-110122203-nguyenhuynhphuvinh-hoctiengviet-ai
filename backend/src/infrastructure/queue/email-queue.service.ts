import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { LoggingService } from '../logging/logging.service';

export interface EmailJob {
  type: 'verification' | 'welcome' | 'password-reset' | 'password-changed';
  to: string;
  data: {
    fullName: string;
    token?: string;
    code?: string;
  };
}

@Injectable()
export class EmailQueueService {
  constructor(
    @InjectQueue('email') private emailQueue: Queue,
    private loggingService: LoggingService,
  ) {}

  async sendVerificationEmail(
    email: string,
    fullName: string,
    token: string,
    code?: string,
  ) {
    await this.emailQueue.add(
      'send-email',
      {
        type: 'verification',
        to: email,
        data: { fullName, token, code },
      } as EmailJob,
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );

    this.loggingService.log(
      `Verification email queued for: ${email}`,
      'EmailQueueService',
    );
  }

  async sendWelcomeEmail(email: string, fullName: string) {
    await this.emailQueue.add(
      'send-email',
      {
        type: 'welcome',
        to: email,
        data: { fullName },
      } as EmailJob,
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );

    this.loggingService.log(
      `Welcome email queued for: ${email}`,
      'EmailQueueService',
    );
  }

  async sendPasswordResetEmail(
    email: string,
    fullName: string,
    token: string,
    code?: string,
  ) {
    await this.emailQueue.add(
      'send-email',
      {
        type: 'password-reset',
        to: email,
        data: { fullName, token, code },
      } as EmailJob,
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );

    this.loggingService.log(
      `Password reset email queued for: ${email}`,
      'EmailQueueService',
    );
  }

  async sendPasswordChangedEmail(email: string, fullName: string) {
    await this.emailQueue.add(
      'send-email',
      {
        type: 'password-changed',
        to: email,
        data: { fullName },
      } as EmailJob,
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );

    this.loggingService.log(
      `Password changed email queued for: ${email}`,
      'EmailQueueService',
    );
  }
}
