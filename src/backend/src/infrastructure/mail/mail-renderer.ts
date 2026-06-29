import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Handlebars from 'handlebars';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';

@Injectable()
export class MailRenderer implements OnModuleInit {
  private templates = new Map<string, HandlebarsTemplateDelegate>();
  private layout?: HandlebarsTemplateDelegate;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const dir = this.resolveTemplateDir();

    const layoutPath = join(dir, 'layout.hbs');
    if (existsSync(layoutPath)) {
      this.layout = Handlebars.compile(readFileSync(layoutPath, 'utf-8'));
    }

    for (const f of readdirSync(dir)) {
      if (!f.endsWith('.hbs') || f === 'layout.hbs') continue;
      const name = f.replace('.hbs', '');
      this.templates.set(
        name,
        Handlebars.compile(readFileSync(join(dir, f), 'utf-8')),
      );
    }
  }

  render(template: string, context: Record<string, unknown>): string {
    const tpl = this.templates.get(template);
    if (!tpl) throw new Error(`Mail template not found: ${template}`);
    const body = tpl(context);
    if (this.layout) {
      return this.layout({ ...context, body: new Handlebars.SafeString(body) });
    }
    return body;
  }

  private resolveTemplateDir(): string {
    // Configured dir may be relative to process.cwd(); also try dist neighbour.
    const configured = this.configService.get<string>('mail.template.dir');
    const candidates = [
      configured,
      resolve(__dirname, 'templates'),
      resolve(process.cwd(), 'src/infrastructure/mail/templates'),
      resolve(process.cwd(), 'dist/infrastructure/mail/templates'),
    ].filter((p): p is string => !!p);
    for (const c of candidates) {
      if (existsSync(c)) return c;
    }
    throw new Error(
      `Mail template dir not found. Tried: ${candidates.join(', ')}`,
    );
  }
}
