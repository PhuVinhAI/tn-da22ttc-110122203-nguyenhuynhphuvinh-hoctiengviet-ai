import {
  buildMailTemplateContext,
  formatMailTimestamp,
} from './mail-template.context';

describe('mail-template.context', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('buildMailTemplateContext uses LinVNix defaults', () => {
    delete process.env.APP_NAME;
    delete process.env.APP_TAGLINE;
    delete process.env.MAIL_FROM_ADDRESS;
    delete process.env.MAIL_FROM;
    delete process.env.MAIL_USER;

    const ctx = buildMailTemplateContext();

    expect(ctx.appName).toBe('LinVNix');
    expect(ctx.tagline).toBe('Learn Vietnamese, your way');
    expect(ctx.year).toBe(new Date().getFullYear());
  });

  it('formatMailTimestamp returns a non-empty English locale string', () => {
    const formatted = formatMailTimestamp(new Date('2026-05-20T10:30:00Z'));
    expect(formatted.length).toBeGreaterThan(0);
    expect(formatted).toMatch(/2026/);
  });
});
