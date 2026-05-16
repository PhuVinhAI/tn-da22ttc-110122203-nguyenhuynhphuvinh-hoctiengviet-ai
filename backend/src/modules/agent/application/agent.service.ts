import { Injectable, Inject, Logger } from '@nestjs/common';
import type {
  IAiProvider,
  AiChatRequest,
  AiChatResponse,
  AiMessage,
  AiFunctionResult,
  ToolContext,
} from '@linvnix/shared';
import { BaseTool } from '@linvnix/shared';
import { ConversationService } from '../../conversations/application/conversation.service';
import { GenaiService } from '../../../infrastructure/genai/genai.service';
import { UsersService } from '../../users/application/users.service';
import { ConversationMessageRole } from '../../../common/enums';
import { ZodError } from 'zod';
import type { Conversation } from '../../conversations/domain/conversation.entity';
import type { ConversationMessage } from '../../conversations/domain/conversation-message.entity';
import type { StreamEvent } from './stream-event';

export const AI_TOOL_MAX_ITERATIONS = 10;

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private readonly toolMap: Map<string, BaseTool<any, any>> = new Map();

  constructor(
    @Inject('AI_PROVIDER')
    private readonly aiProvider: IAiProvider,
    private readonly conversationService: ConversationService,
    private readonly genaiService: GenaiService,
    private readonly usersService: UsersService,
    // Inject all BaseTool subclasses; they are registered as providers in AgentModule
    @Inject('TOOLS')
    private readonly tools: BaseTool<any, any>[],
  ) {
    for (const tool of this.tools) {
      this.toolMap.set(tool.name, tool);
    }
  }

  async runTurn(
    conversationId: string,
    userMessage: string,
  ): Promise<AiChatResponse> {
    const conversation =
      await this.conversationService.findById(conversationId);
    const messages = conversation.messages || [];

    // Owner is hydrated once per turn; tools read user-scoped settings via ctx.user.
    const user = await this.usersService.findById(conversation.userId);
    const ctx: ToolContext = {
      userId: conversation.userId,
      conversationId,
      screenContext: conversation.screenContext ?? {},
      user,
    };

    let systemInstruction = conversation.systemInstruction || '';
    if (conversation.lessonId) {
      // TODO: inject lesson/vocabulary context into system prompt
      systemInstruction += `\nCurrent lesson ID: ${conversation.lessonId}`;
    }

    await this.conversationService.addMessage(conversationId, {
      role: ConversationMessageRole.USER,
      content: userMessage,
      tokenCount: 0,
    });

    const aiMessages: AiMessage[] = [
      ...messages.map((msg) => {
        let role: 'user' | 'assistant' | 'system' | 'function';
        switch (msg.role) {
          case ConversationMessageRole.USER:
            role = 'user';
            break;
          case ConversationMessageRole.ASSISTANT:
            role = 'assistant';
            break;
          case ConversationMessageRole.TOOL:
            role = 'function';
            break;
          default:
            role = 'system';
        }
        return { role, content: msg.content };
      }),
      { role: 'user', content: userMessage },
    ];

    const toolDeclarations = this.tools.map((tool) => tool.toDeclaration());

    let iterations = 0;
    let finalResponse: AiChatResponse | null = null;

    while (iterations < AI_TOOL_MAX_ITERATIONS) {
      iterations++;

      const request: AiChatRequest = {
        messages: aiMessages,
        systemInstruction,
        tools: toolDeclarations,
      };

      const response = await this.aiProvider.chat(request);
      finalResponse = response;

      const assistantTokenCount =
        response.usageMetadata?.candidatesTokenCount || 0;
      await this.conversationService.addMessage(conversationId, {
        role: ConversationMessageRole.ASSISTANT,
        content: response.text,
        tokenCount: assistantTokenCount,
      });

      await this.conversationService.accumulateTokens(
        conversationId,
        response.usageMetadata?.promptTokenCount || 0,
        assistantTokenCount,
      );

      if (!response.functionCalls || response.functionCalls.length === 0) {
        break;
      }

      const functionResults: AiFunctionResult[] = [];
      for (const fc of response.functionCalls) {
        const tool = this.toolMap.get(fc.name);
        if (!tool) {
          this.logger.warn(`Tool ${fc.name} not found`);
          functionResults.push({
            name: fc.name,
            result: { error: `Tool ${fc.name} not found` },
          });
          continue;
        }

        let validatedParams: any;
        try {
          validatedParams = tool.parameters.parse(fc.arguments);
        } catch (error) {
          if (error instanceof ZodError) {
            this.logger.warn(
              `Invalid parameters for tool ${fc.name}: ${error.message}`,
            );
            functionResults.push({
              name: fc.name,
              result: { error: `Invalid parameters: ${error.message}` },
            });
            continue;
          }
          throw error;
        }

        try {
          const result = await tool.execute(validatedParams, ctx);
          functionResults.push({
            name: fc.name,
            result,
          });
        } catch (error) {
          this.logger.error(`Tool ${fc.name} execution failed: ${error}`);
          functionResults.push({
            name: fc.name,
            result: { error: `Tool execution failed: ${error.message}` },
          });
        }
      }

      await this.conversationService.addMessage(conversationId, {
        role: ConversationMessageRole.TOOL,
        content: '',
        toolCalls: response.functionCalls,
        toolResults: functionResults,
        tokenCount: 0,
      });

      aiMessages.push(
        ...response.functionCalls.map((fc) => ({
          role: 'assistant' as const,
          content: '',
          functionCall: fc,
        })),
        ...functionResults.map((fr) => ({
          role: 'function' as const,
          content: '',
          functionResult: fr,
        })),
      );
    }

    if (iterations >= AI_TOOL_MAX_ITERATIONS) {
      this.logger.warn(
        `Tool loop reached max iterations (${AI_TOOL_MAX_ITERATIONS})`,
      );
    }

    return finalResponse!;
  }

  /**
   * Streaming variant of `runTurn`. Yields typed events at every interesting
   * boundary of an agent turn so the SSE controller can forward them to the
   * mobile client.
   *
   * - `conversationId === null` → lazily creates a Conversation under `userId`
   *   and snapshots the provided `screenContext` onto it.
   * - When the active Conversation has a non-empty `screenContext` the
   *   system instruction is rendered from the `assistant-tutor` YAML template
   *   (per the PRD persona spec). Otherwise the conversation's stored
   *   `systemInstruction` is used as-is.
   * - When the `abortSignal` is aborted mid-turn (mobile client cancelled the
   *   stream) the loop exits and a partial assistant message with
   *   `interrupted=true` is persisted. The final `done` event carries the
   *   same flag.
   *
   * NOTE: This V1 tracer uses non-streaming `chat()` for every iteration of
   * the ReAct tool loop, because the Gemini Developer API does not reliably
   * stream function calls (per `js-genai/sdk-samples/chat_afc_streaming_*`).
   * The final response text is yielded as a single `text_chunk` event. A
   * future enhancement can split it via `chatStream` once the dev API gains
   * streaming function-call support.
   */
  async *runTurnStream(
    userId: string,
    conversationId: string | null,
    userMessage: string,
    screenContext?: Record<string, any>,
    abortSignal?: AbortSignal,
  ): AsyncIterable<StreamEvent> {
    let activeConversationId = conversationId;
    if (activeConversationId === null) {
      const created = await this.conversationService.create(userId, {
        model: 'gemini-2.0-flash',
        screenContext: screenContext ?? {},
      });
      activeConversationId = created.id;
    }

    // Announce the resolved conversation id as the first event so mobile
    // clients can persist it for follow-up "Soạn tiếp" messages and
    // distinguish from a "Reset"-triggered fresh conversation.
    yield {
      type: 'conversation_started',
      conversationId: activeConversationId,
    };

    const conversation =
      await this.conversationService.findById(activeConversationId);
    const user = await this.usersService.findById(conversation.userId);

    const ctx: ToolContext = {
      userId: conversation.userId,
      conversationId: activeConversationId,
      screenContext: conversation.screenContext ?? {},
      user,
    };

    const systemInstruction = this.buildSystemInstruction(conversation, user);

    let interrupted = false;
    let finalAssistantMessage: ConversationMessage | null = null;

    if (abortSignal?.aborted) {
      interrupted = true;
    } else {
      await this.conversationService.addMessage(activeConversationId, {
        role: ConversationMessageRole.USER,
        content: userMessage,
        tokenCount: 0,
      });
    }

    const aiMessages: AiMessage[] = [
      ...(conversation.messages || []).map((msg) => {
        let role: 'user' | 'assistant' | 'system' | 'function';
        switch (msg.role) {
          case ConversationMessageRole.USER:
            role = 'user';
            break;
          case ConversationMessageRole.ASSISTANT:
            role = 'assistant';
            break;
          case ConversationMessageRole.TOOL:
            role = 'function';
            break;
          default:
            role = 'system';
        }
        return { role, content: msg.content };
      }),
      { role: 'user', content: userMessage },
    ];

    const toolDeclarations = this.tools.map((tool) => tool.toDeclaration());

    let iterations = 0;

    toolLoop: while (!interrupted && iterations < AI_TOOL_MAX_ITERATIONS) {
      iterations++;

      if (abortSignal?.aborted) {
        interrupted = true;
        break;
      }

      const request: AiChatRequest = {
        messages: aiMessages,
        systemInstruction,
        tools: toolDeclarations,
      };

      const response = await this.aiProvider.chat(request);

      const assistantTokens = response.usageMetadata?.candidatesTokenCount || 0;
      await this.conversationService.accumulateTokens(
        activeConversationId,
        response.usageMetadata?.promptTokenCount || 0,
        assistantTokens,
      );

      const calls = response.functionCalls ?? [];

      if (calls.length === 0) {
        // Final answer turn — no more tools to call. Yield the full text as
        // a single text_chunk and persist the final assistant message.
        yield { type: 'text_chunk', text: response.text };

        finalAssistantMessage = await this.conversationService.addMessage(
          activeConversationId,
          {
            role: ConversationMessageRole.ASSISTANT,
            content: response.text,
            tokenCount: assistantTokens,
            interrupted: false,
          },
        );
        break;
      }

      // Persist the intermediate assistant turn (mirrors runTurn) and then
      // walk through each tool call.
      await this.conversationService.addMessage(activeConversationId, {
        role: ConversationMessageRole.ASSISTANT,
        content: response.text,
        tokenCount: assistantTokens,
      });

      const functionResults: AiFunctionResult[] = [];
      for (const fc of calls) {
        if (abortSignal?.aborted) {
          interrupted = true;
          break toolLoop;
        }

        const tool = this.toolMap.get(fc.name);
        const displayName = tool?.displayName ?? fc.name;

        yield {
          type: 'tool_start',
          name: fc.name,
          displayName,
          args: fc.arguments,
        };

        if (!tool) {
          this.logger.warn(`Tool ${fc.name} not found`);
          functionResults.push({
            name: fc.name,
            result: { error: `Tool ${fc.name} not found` },
          });
          yield { type: 'tool_result', name: fc.name, ok: false };
          continue;
        }

        let validatedParams: any;
        try {
          validatedParams = tool.parameters.parse(fc.arguments);
        } catch (error) {
          if (error instanceof ZodError) {
            this.logger.warn(
              `Invalid parameters for tool ${fc.name}: ${error.message}`,
            );
            functionResults.push({
              name: fc.name,
              result: { error: `Invalid parameters: ${error.message}` },
            });
            yield { type: 'tool_result', name: fc.name, ok: false };
            continue;
          }
          throw error;
        }

        try {
          const result = await tool.execute(validatedParams, ctx);
          const ok = !(result && result.error);
          functionResults.push({ name: fc.name, result });
          yield { type: 'tool_result', name: fc.name, ok };
        } catch (error) {
          this.logger.error(`Tool ${fc.name} execution failed: ${error}`);
          functionResults.push({
            name: fc.name,
            result: {
              error: `Tool execution failed: ${(error as Error).message}`,
            },
          });
          yield { type: 'tool_result', name: fc.name, ok: false };
        }
      }

      // Persist the tool message capturing both calls and results.
      await this.conversationService.addMessage(activeConversationId, {
        role: ConversationMessageRole.TOOL,
        content: '',
        toolCalls: calls,
        toolResults: functionResults,
        tokenCount: 0,
      });

      // Check abort BEFORE looping so an abort that landed during the inner
      // tool walk is honored immediately.
      if (abortSignal?.aborted) {
        interrupted = true;
        break;
      }

      aiMessages.push(
        ...calls.map((fc) => ({
          role: 'assistant' as const,
          content: '',
          functionCall: fc,
        })),
        ...functionResults.map((fr) => ({
          role: 'function' as const,
          content: '',
          functionResult: fr,
        })),
      );
    }

    if (iterations >= AI_TOOL_MAX_ITERATIONS && !finalAssistantMessage) {
      this.logger.warn(
        `Tool loop reached max iterations (${AI_TOOL_MAX_ITERATIONS})`,
      );
    }

    if (!finalAssistantMessage) {
      // Either aborted before we reached the no-tools branch, or we ran out
      // of iterations. Persist a partial assistant message so the client and
      // history still have an anchor for the turn.
      finalAssistantMessage = await this.conversationService.addMessage(
        activeConversationId,
        {
          role: ConversationMessageRole.ASSISTANT,
          content: '',
          tokenCount: 0,
          interrupted,
        },
      );
    }

    yield {
      type: 'done',
      messageId: finalAssistantMessage.id,
      interrupted,
    };
  }

  private buildSystemInstruction(
    conversation: Conversation,
    user: any,
  ): string {
    const sc = conversation.screenContext ?? {};
    const hasScreenContext = Object.keys(sc).length > 0;

    if (hasScreenContext) {
      // The assistant-tutor template uses `{{screenContext.data}}` as a flat
      // placeholder, so the renderer needs `data` pre-serialized to a JSON
      // string before substitution (see prompts/assistant-tutor.yaml).
      return this.genaiService.renderPrompt('assistant-tutor', {
        user: {
          nativeLanguage: user?.nativeLanguage ?? '',
          currentLevel: user?.currentLevel ?? '',
          preferredDialect: user?.preferredDialect ?? '',
        },
        screenContext: {
          route: sc.route ?? '',
          displayName: sc.displayName ?? '',
          data: JSON.stringify(sc.data ?? {}),
        },
      });
    }

    let systemInstruction = conversation.systemInstruction || '';
    if (conversation.lessonId) {
      systemInstruction += `\nCurrent lesson ID: ${conversation.lessonId}`;
    }
    return systemInstruction;
  }
}
