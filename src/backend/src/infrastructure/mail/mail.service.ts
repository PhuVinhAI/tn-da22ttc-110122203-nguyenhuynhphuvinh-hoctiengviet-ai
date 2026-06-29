import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { LoggingService } from '../logging/logging.service';
import {
  buildMailTemplateContext,
  formatMailTimestamp,
} from './mail-template.context';
import { MailRenderer } from './mail-renderer';
import { RESEND_CLIENT } from './mail.tokens';

@Injectable()
export class MailService {
  constructor(
    @Inject(RESEND_CLIENT) private readonly resend: Resend,
    private readonly renderer: MailRenderer,
    private readonly configService: ConfigService,
    private readonly loggingService: LoggingService,
  ) {}

  private async send(opts: {
    to: string;
    subject: string;
    template: string;
    context: Record<string, unknown>;
    throwOnError?: boolean;
  }) {
    if (process.env.SKIP_MAIL_SENDING === 'true') {
      this.loggingService.log(
        `[SKIPPED] ${opts.template} email for: ${opts.to}`,
        'MailService',
      );
      return;
    }

    const html = this.renderer.render(opts.template, opts.context);
    const from = this.configService.get<string>('mail.defaults.from')!;

    const { data, error } = await this.resend.emails.send({
      from,
      to: opts.to,
      subject: opts.subject,
      html,
    });

    if (error) {
      this.loggingService.error(
        `Resend ${opts.template} send failed to ${opts.to}: ${error.message}`,
        JSON.stringify(error),
        'MailService',
      );
      if (opts.throwOnError) {
        throw new Error(error.message || 'Resend send failed');
      }
      return;
    }

    this.loggingService.log(
      `${opts.template} email sent to: ${opts.to} (id=${data?.id})`,
      'MailService',
    );
  }

  async sendVerificationEmail(
    email: string,
    fullName: string,
    _token: string,
    code?: string,
  ) {
    await this.send({
      to: email,
      subject: '[LinVNix] Verify your email',
      template: 'verification',
      context: {
        ...buildMailTemplateContext(),
        fullName,
        code: code || '',
      },
      throwOnError: true,
    });
  }

  async sendWelcomeEmail(email: string, fullName: string) {
    await this.send({
      to: email,
      subject: '[LinVNix] Welcome to LinVNix',
      template: 'welcome',
      context: {
        ...buildMailTemplateContext(),
        fullName,
      },
    });
  }

  async sendPasswordResetEmail(
    email: string,
    fullName: string,
    _token: string,
    code?: string,
  ) {
    await this.send({
      to: email,
      subject: '[LinVNix] Reset your password',
      template: 'password-reset',
      context: {
        ...buildMailTemplateContext(),
        fullName,
        code: code || '',
        expiresIn: '15 phút',
      },
      throwOnError: true,
    });
  }

  async sendPasswordChangedEmail(email: string, fullName: string) {
    await this.send({
      to: email,
      subject: '[LinVNix] Your password was changed',
      template: 'password-changed',
      context: {
        ...buildMailTemplateContext(),
        fullName,
        timestamp: formatMailTimestamp(),
      },
    });
  }
}
