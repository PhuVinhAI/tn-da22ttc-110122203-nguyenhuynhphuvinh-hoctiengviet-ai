import { Injectable } from '@nestjs/common';
import { BaseTool, ToolContext } from '@linvnix/shared';
import { z, ZodSchema } from 'zod';

@Injectable()
export class EchoTool extends BaseTool<
  Record<string, any>,
  Record<string, any>
> {
  readonly name = 'echo';
  readonly displayName = 'Processing...';
  readonly description = 'Echoes the input parameters back as result';
  readonly parameters: ZodSchema<Record<string, any>> = z.record(z.any());

  async execute(
    params: Record<string, any>,
    _ctx: ToolContext,
  ): Promise<Record<string, any>> {
    return { echo: params };
  }
}
