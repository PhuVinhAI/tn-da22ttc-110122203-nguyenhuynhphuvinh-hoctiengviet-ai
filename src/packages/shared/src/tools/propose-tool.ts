import type { ZodSchema } from 'zod';
import type { ToolContext } from './tool-context.js';
import { BaseTool } from './base-tool.js';
import type { ProposalPayload } from './proposal-payload.js';

export abstract class ProposeTool<TParams> extends BaseTool<TParams, ProposalPayload> {
  abstract execute(params: TParams, ctx: ToolContext): Promise<ProposalPayload>;
  abstract readonly parameters: ZodSchema<TParams>;
}
