export interface MailTemplateContext {
  appName: string;
  tagline: string;
  year: number;
  supportEmail: string;
}

export function buildMailTemplateContext(): MailTemplateContext {
  return {
    appName: process.env.APP_NAME || 'LinVNix',
    tagline: process.env.APP_TAGLINE || 'Learn Vietnamese, your way',
    year: new Date().getFullYear(),
    supportEmail:
      process.env.MAIL_FROM_ADDRESS ||
      process.env.MAIL_FROM ||
      process.env.MAIL_USER ||
      '',
  };
}

export function formatMailTimestamp(date = new Date()): string {
  return date.toLocaleString('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    dateStyle: 'full',
    timeStyle: 'short',
  });
}
