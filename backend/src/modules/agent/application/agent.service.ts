import { Injectable, Inject, Logger } from '@nestjs/common';
import type {
  AiChatRequest,
  AiChatResponse,
  AiMessage,
  AiFunctionResult,
  ToolContext,
} from '@linvnix/shared';
import { BaseTool } from '@linvnix/shared';
import { ConversationService } from '../../conversations/application/conversation.service';
import { AiProviderRouter } from '../../../infrastructure/ai/ai-provider-router';
import { UsersService } from '../../users/application/users.service';
import { ConversationMessageRole } from '../../../common/enums';
import { ZodError } from 'zod';
import fs from 'fs';
import * as path from 'path';
import type { Conversation } from '../../conversations/domain/conversation.entity';
import type { ConversationMessage } from '../../conversations/domain/conversation-message.entity';
import type { StreamEvent } from './stream-event';

export const AI_TOOL_MAX_ITERATIONS = 10;

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private readonly toolMap: Map<string, BaseTool<any, any>> = new Map();

  constructor(
    private readonly router: AiProviderRouter,
    private readonly conversationService: ConversationService,
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

    const aiMessages = this.mapHistoryToAiMessages(messages, userMessage);

    const toolDeclarations = this.tools.map((tool) => tool.toDeclaration());

    let iterations = 0;
    let finalResponse: AiChatResponse | null = null;

    while (iterations < AI_TOOL_MAX_ITERATIONS) {
      iterations++;

      const request: AiChatRequest = {
        messages: aiMessages,
        systemInstruction,
        ...(iterations === 1 ? { tools: toolDeclarations } : {}),
      };

      const response = await this.router.forFeature('assistant').chat(request);
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
          functionResults.push(this.shapeToolNotFound(fc.name));
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
            functionResults.push(this.shapeInvalidParams(fc.name, error));
            continue;
          }
          throw error;
        }

        try {
          const result = await tool.execute(validatedParams, ctx);
          functionResults.push({ name: fc.name, result });
        } catch (error) {
          this.logger.error(`Tool ${fc.name} execution failed: ${error}`);
          functionResults.push(this.shapeExecutionError(fc.name, error));
        }
      }

      await this.conversationService.addMessage(conversationId, {
        role: ConversationMessageRole.TOOL,
        content: '',
        toolCalls: response.functionCalls,
        toolResults: functionResults,
        tokenCount: 0,
      });

      this.appendToolTurnToHistory(
        aiMessages,
        response.functionCalls,
        functionResults,
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
   * Uses `chatStream()` for each model iteration so text is forwarded as soon
   * as the provider emits it, including pre-tool text from the first model
   * turn. Function calls are collected from the same stream, then executed
   * after the model finishes that iteration.
   */
  async *runTurnStream(
    userId: string,
    conversationId: string | null,
    userMessage: string,
    screenContext?: Record<string, any>,
    abortSignal?: AbortSignal,
  ): AsyncIterable<StreamEvent> {
    let activeConversationId = conversationId;
    const createdConversationFromRequest = activeConversationId === null;
    if (activeConversationId === null) {
      const autoTitle =
        userMessage.length > 50 ? userMessage.substring(0, 50) : userMessage;
      const created = await this.conversationService.create(userId, {
        model: 'gemini-2.0-flash',
        screenContext: screenContext ?? {},
        title: autoTitle,
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
    const effectiveScreenContext =
      screenContext ?? conversation.screenContext ?? {};

    if (!createdConversationFromRequest && screenContext !== undefined) {
      await this.conversationService.updateScreenContext(
        activeConversationId,
        screenContext,
      );
    }

    const ctx: ToolContext = {
      userId: conversation.userId,
      conversationId: activeConversationId,
      screenContext: effectiveScreenContext,
      user,
    };

    const systemInstruction = this.buildSystemInstruction(
      {
        ...conversation,
        screenContext: effectiveScreenContext,
      },
      user,
    );

    let interrupted = false;
    let finalAssistantMessage: ConversationMessage | null = null;
    let interruptedResponseText = '';
    let interruptedAssistantTokens = 0;

    if (abortSignal?.aborted) {
      interrupted = true;
    } else {
      await this.conversationService.addMessage(activeConversationId, {
        role: ConversationMessageRole.USER,
        content: userMessage,
        tokenCount: 0,
      });
    }

    const aiMessages = this.mapHistoryToAiMessages(
      conversation.messages || [],
      userMessage,
    );

    const toolDeclarations = this.tools.map((tool) => tool.toDeclaration());
    const safeConversationId = activeConversationId.replace(
      /[^a-zA-Z0-9_-]/g,
      '_',
    );
    const aiDebugSnapshot = {
      fileName: `ai-turn-${safeConversationId}-${Date.now()}.json`,
      timestamp: new Date().toISOString(),
      userId,
      conversationId: activeConversationId,
      lessonId: conversation.lessonId,
      courseId: conversation.courseId,
      iterations: [] as Array<{
        iteration: number;
        request: Omit<AiChatRequest, 'abortSignal'>;
      }>,
    };

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
        ...(iterations === 1 ? { tools: toolDeclarations } : {}),
        ...(abortSignal ? { abortSignal } : {}),
      };

      aiDebugSnapshot.iterations.push({
        iteration: iterations,
        request: this.serializeAiRequestForDebug(request),
      });
      this.writeAiDebugSnapshot(aiDebugSnapshot);

      let responseText = '';
      let responseUsage: AiChatResponse['usageMetadata'] = {};
      const calls: NonNullable<AiChatResponse['functionCalls']> = [];

      try {
        for await (const chunk of this.router
          .forFeature('assistant')
          .chatStream(request)) {
          if (abortSignal?.aborted) {
            interrupted = true;
            interruptedResponseText = responseText;
            interruptedAssistantTokens =
              responseUsage?.candidatesTokenCount || 0;
            break toolLoop;
          }

          if (chunk.text) {
            responseText += chunk.text;
            yield { type: 'text_chunk', text: chunk.text };
          }

          if (chunk.functionCalls?.length) {
            calls.push(...chunk.functionCalls);
          }

          if (chunk.usageMetadata) {
            responseUsage = {
              ...responseUsage,
              ...chunk.usageMetadata,
            };
          }
        }
      } catch (error) {
        if (abortSignal?.aborted) {
          interrupted = true;
          interruptedResponseText = responseText;
          interruptedAssistantTokens = responseUsage?.candidatesTokenCount || 0;
          break toolLoop;
        }
        throw error;
      }

      if (abortSignal?.aborted) {
        interrupted = true;
        interruptedResponseText = responseText;
        interruptedAssistantTokens = responseUsage?.candidatesTokenCount || 0;
        break;
      }

      const assistantTokens = responseUsage?.candidatesTokenCount || 0;
      await this.conversationService.accumulateTokens(
        activeConversationId,
        responseUsage?.promptTokenCount || 0,
        assistantTokens,
      );

      if (calls.length === 0) {
        // Final answer turn — no more tools to call. Text chunks have already
        // been yielded as provider deltas; persist the assembled message.
        finalAssistantMessage = await this.conversationService.addMessage(
          activeConversationId,
          {
            role: ConversationMessageRole.ASSISTANT,
            content: responseText,
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
        content: responseText,
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
          functionResults.push(this.shapeToolNotFound(fc.name));
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
            functionResults.push(this.shapeInvalidParams(fc.name, error));
            yield { type: 'tool_result', name: fc.name, ok: false };
            continue;
          }
          throw error;
        }

        try {
          const result = await tool.execute(validatedParams, ctx);
          const ok = this.computeToolOk(result);
          functionResults.push({ name: fc.name, result });
          yield { type: 'tool_result', name: fc.name, ok };
        } catch (error) {
          this.logger.error(`Tool ${fc.name} execution failed: ${error}`);
          functionResults.push(this.shapeExecutionError(fc.name, error));
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

      this.appendToolTurnToHistory(aiMessages, calls, functionResults);
    }

    if (iterations >= AI_TOOL_MAX_ITERATIONS && !finalAssistantMessage) {
      this.logger.warn(
        `Tool loop reached max iterations (${AI_TOOL_MAX_ITERATIONS})`,
      );
    }

    if (!finalAssistantMessage) {
      // User cancelled before AI streamed anything — check if the user message
      // was already deleted by the client (same pattern as simulation stop).
      const userMsgExists =
        await this.conversationService.lastUserMessageExists(
          activeConversationId,
        );
      if (!userMsgExists) {
        // Client deleted the user message — discard this turn entirely.
        return;
      }

      // Either aborted before we reached the no-tools branch, or we ran out
      // of iterations. Persist a partial assistant message so the client and
      // history still have an anchor for the turn.
      finalAssistantMessage = await this.conversationService.addMessage(
        activeConversationId,
        {
          role: ConversationMessageRole.ASSISTANT,
          content: interrupted ? interruptedResponseText : '',
          tokenCount: interrupted ? interruptedAssistantTokens : 0,
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

  private mapHistoryToAiMessages(
    messages: ConversationMessage[],
    userMessage: string,
  ): AiMessage[] {
    const aiMessages: AiMessage[] = [];
    for (const msg of messages) {
      if (msg.role === ConversationMessageRole.TOOL) {
        const toolCalls = msg.toolCalls || [];
        const toolResults = msg.toolResults || [];
        for (let i = 0; i < toolCalls.length; i++) {
          const callId = `hist_${msg.id}_${i}`;
          aiMessages.push({
            role: 'assistant',
            content: '',
            functionCall: {
              id: callId,
              name: toolCalls[i].name,
              arguments: toolCalls[i].arguments,
            },
          });
        }
        for (let i = 0; i < toolResults.length; i++) {
          const callId = `hist_${msg.id}_${i}`;
          aiMessages.push({
            role: 'function',
            content: '',
            functionResult: {
              callId,
              name: toolResults[i].name,
              result: toolResults[i].result,
            },
          });
        }
        continue;
      }

      let role: 'user' | 'assistant' | 'system';
      switch (msg.role) {
        case ConversationMessageRole.USER:
          role = 'user';
          break;
        case ConversationMessageRole.ASSISTANT:
          role = 'assistant';
          break;
        default:
          role = 'system';
      }
      aiMessages.push({ role, content: msg.content });
    }
    aiMessages.push({ role: 'user', content: userMessage });
    return aiMessages;
  }

  private buildSystemInstruction(
    conversation: Pick<
      Conversation,
      'screenContext' | 'systemInstruction' | 'lessonId'
    >,
    user: any,
  ): string {
    const sc = conversation.screenContext ?? {};
    const hasScreenContext = Object.keys(sc).length > 0;

    if (hasScreenContext) {
      // The assistant-tutor template uses `{{screenContext.data}}` as a flat
      // placeholder, so the renderer needs `data` pre-serialized to a JSON
      // string before substitution (see prompts/assistant-tutor.yaml).
      return this.router.renderPrompt('assistant-tutor', {
        user: {
          nativeLanguage: user?.nativeLanguage?.trim() || 'English',
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

  // ---- Shared tool-loop helpers (used by both runTurn and runTurnStream) ----
  // These extract the verbatim-duplicated error-shaping + history-append
  // logic so the two loops cannot silently diverge. The loops keep their own
  // orchestration (streaming yields, abort control flow, debug snapshots).

  /** Shape the result for an unknown tool name. Identical string in both loops. */
  private shapeToolNotFound(name: string): AiFunctionResult {
    return { name, result: { error: `Tool ${name} not found` } };
  }

  /** Shape the result for a ZodError during parameter validation. */
  private shapeInvalidParams(name: string, error: ZodError): AiFunctionResult {
    return { name, result: { error: `Invalid parameters: ${error.message}` } };
  }

  /**
   * Shape the result for a tool execution failure. Uses the explicit
   * `(error as Error).message` cast form so behavior is identical for Error
   * instances and safer under strict catch-variable typing.
   */
  private shapeExecutionError(name: string, error: unknown): AiFunctionResult {
    return {
      name,
      result: { error: `Tool execution failed: ${(error as Error).message}` },
    };
  }

  /**
   * Stream-only `ok` flag: a successfully-executed tool that returns an
   * `{ error }` payload is reported as `ok: false`. Kept as a helper so the
   * contract lives in one place.
   */
  private computeToolOk(result: unknown): boolean {
    return !(result && (result as { error?: unknown }).error);
  }

  /**
   * Append one tool turn (the model's function calls + the tool results) to
   * the running AI message history. Verbatim-identical between both loops.
   */
  private appendToolTurnToHistory(
    aiMessages: AiMessage[],
    calls: NonNullable<AiChatResponse['functionCalls']>,
    functionResults: AiFunctionResult[],
  ): void {
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

  private serializeAiRequestForDebug(
    request: AiChatRequest,
  ): Omit<AiChatRequest, 'abortSignal'> {
    const requestForLog: Record<string, any> = { ...request };
    delete requestForLog.abortSignal;
    return requestForLog as Omit<AiChatRequest, 'abortSignal'>;
  }

  private writeAiDebugSnapshot(input: {
    fileName: string;
    timestamp: string;
    userId: string;
    conversationId: string;
    lessonId?: string | null;
    courseId?: string | null;
    iterations: Array<{
      iteration: number;
      request: Omit<AiChatRequest, 'abortSignal'>;
    }>;
  }): void {
    // Dev-only: never write debug snapshots in production (PII risk + event-loop
    // blocking from sync fs writes). Even in dev, write asynchronously so the
    // request path is not blocked, and only persist non-PII metadata (IDs +
    // iteration request shapes) — the user message and screen-context content
    // are intentionally excluded.
    if (process.env.NODE_ENV === 'production') {
      return;
    }
    try {
      const debugDir = path.join(process.cwd(), 'debug');
      const filePath = path.join(debugDir, input.fileName);
      const content = {
        timestamp: input.timestamp,
        userId: input.userId,
        conversationId: input.conversationId,
        lessonId: input.lessonId,
        courseId: input.courseId,
        iterations: input.iterations,
      };
      const serialized = JSON.stringify(content, null, 2);

      // Async mkdir + write so the request path is not blocked under load.
      fs.promises
        .mkdir(debugDir, { recursive: true })
        .then(() => fs.promises.writeFile(filePath, serialized, 'utf8'))
        .catch((error: NodeJS.ErrnoException) =>
          this.logger.warn(
            `Failed to write AI debug snapshot: ${error.message}`,
          ),
        );

      this.logger.debug(`AI debug snapshot written to debug/${input.fileName}`);
    } catch (error) {
      this.logger.warn(
        `Failed to write AI debug snapshot: ${(error as Error).message}`,
      );
    }
  }
}
