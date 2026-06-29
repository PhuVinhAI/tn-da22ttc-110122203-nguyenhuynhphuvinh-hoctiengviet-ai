import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  resendApiKey: process.env.RESEND_API_KEY,
  defaults: {
    // Resend sandbox domain works without verification — sends to any address.
    // For production-verified emails, set MAIL_FROM_ADDRESS to a verified domain.
    from: `${process.env.MAIL_FROM_NAME || 'LinVNix'} <${process.env.MAIL_FROM_ADDRESS || 'onboarding@resend.dev'}>`,
  },
  template: {
    dir: process.cwd() + '/src/infrastructure/mail/templates',
  },
}));
