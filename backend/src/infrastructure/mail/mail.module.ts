import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import mailConfig from '../../config/mail.config';

// Import HandlebarsAdapter dynamically to avoid type issues
const HandlebarsAdapter = require('@nestjs-modules/mailer/dist/adapters/handlebars.adapter').HandlebarsAdapter;

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        transport: configService.get('mail.transport'),
        defaults: configService.get('mail.defaults'),
        template: {
          dir: configService.get('mail.template.dir'),
          adapter: new HandlebarsAdapter(),
          options: configService.get('mail.template.options'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
