import { zodToJsonSchema } from 'zod-to-json-schema';
import type { ZodSchema } from 'zod';
import type { ToolDeclaration } from '../types/ai.js';

export abstract class BaseTool<TParams, TResult> {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly parameters: ZodSchema<TParams>;

  abstract execute(params: TParams): Promise<TResult>;

  toDeclaration(): ToolDeclaration {
    const jsonSchema = zodToJsonSchema(this.parameters) as Record<string, any>;
    return {
      name: this.name,
      description: this.description,
      parameters: jsonSchema,
    };
  }
}
