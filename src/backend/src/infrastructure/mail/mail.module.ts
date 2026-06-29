import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { MailService } from './mail.service';
import { MailRenderer } from './mail-renderer';
import { RESEND_CLIENT } from './mail.tokens';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: RESEND_CLIENT,
      useFactory: (configService: ConfigService) => {
        const apiKey = configService.get<string>('mail.resendApiKey');
        if (!apiKey) {
          // Still construct, but operations will fail with clear error when called.
          return new Resend('re_dummy_unconfigured');
        }
        return new Resend(apiKey);
      },
      inject: [ConfigService],
    },
    MailRenderer,
    MailService,
  ],
  exports: [MailService],
})
export class MailModule {}
