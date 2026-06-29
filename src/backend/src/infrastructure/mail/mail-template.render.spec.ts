import * as path from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { buildMailTemplateContext } from './mail-template.context';

describe('mail template rendering', () => {
  const adapter = new HandlebarsAdapter();
  const templateDir = path.join(
    process.cwd(),
    'src/infrastructure/mail/templates',
  );

  const mailerOptions = {
    template: {
      dir: templateDir,
      options: { strict: true },
    },
    options: {
      layout: 'layout',
    },
  };

  const render = (template: string, context: Record<string, unknown>) =>
    new Promise<string>((resolve, reject) => {
      const mail: {
        data: {
          template: string;
          context: Record<string, unknown>;
          html?: string;
        };
      } = {
        data: { template, context },
      };

      adapter.compile(
        mail,
        (err?: Error) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(mail.data.html ?? '');
        },
        mailerOptions,
      );
    });

  it('wraps welcome template in mobile-style layout without side borders', async () => {
    const html = await render('welcome', {
      ...buildMailTemplateContext(),
      fullName: 'Alex',
    });

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Learn Vietnamese, your way');
    expect(html).toContain('Welcome, Alex!');
    expect(html).not.toMatch(/border-left/i);
    expect(html).toMatch(/background-color:\s*#FAFAF9/i);
  });

  it('wraps verification template with OTP card styling', async () => {
    const html = await render('verification', {
      ...buildMailTemplateContext(),
      fullName: 'Alex',
      code: '123456',
    });

    expect(html).toContain('123456');
    expect(html).toContain('Verify your email');
    expect(html).not.toMatch(/border-left/i);
    expect(html).toMatch(/letter-spacing:\s*10px/i);
  });
});
