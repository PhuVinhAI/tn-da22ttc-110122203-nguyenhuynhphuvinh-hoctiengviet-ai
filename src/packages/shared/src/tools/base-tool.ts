import { zodToJsonSchema } from 'zod-to-json-schema';
import type { ZodSchema } from 'zod';
import type { ToolDeclaration } from '../types/ai.js';
import type { ToolContext } from './tool-context.js';

export abstract class BaseTool<TParams, TResult> {
  abstract readonly name: string;

  // Vietnamese status text the mobile assistant shows as the spinner subtitle
  // during Phase B ("Đang suy nghĩ...") of the Mid-mode UI so the learner
  // knows what the AI is doing right now. Required for every tool — emitted
  // via the `tool_start` SSE event by `AgentService.runTurnStream`.
  abstract readonly displayName: string;

  abstract readonly description: string;
  abstract readonly parameters: ZodSchema<TParams>;

  abstract execute(params: TParams, ctx: ToolContext): Promise<TResult>;

  toDeclaration(): ToolDeclaration {
    const jsonSchema = zodToJsonSchema(this.parameters as any) as Record<string, any>;
    return {
      name: this.name,
      description: this.description,
      parameters: jsonSchema,
    };
  }
}
