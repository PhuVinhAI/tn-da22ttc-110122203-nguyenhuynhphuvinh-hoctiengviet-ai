import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Sse,
  MessageEvent,
  ForbiddenException,
  HttpCode,
  Logger,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Observable } from 'rxjs';
import type { Request } from 'express';
import { UseGuards } from '@nestjs/common';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { SkipTransform } from '../../../common/decorators/skip-transform.decorator';
import { Permission } from '../../../common/enums';
import { ConversationService } from '../../conversations/application/conversation.service';
import { AgentService } from '../../agent/application/agent.service';
import { GenaiProvider } from '../../../infrastructure/genai/genai-provider';
import { CreateConversationDto } from '../../conversations/dto/create-conversation.dto';
import { AiChatRequestDto } from '../dto/ai-chat-request.dto';
import { AiChatStreamRequestDto } from '../dto/ai-chat-stream-request.dto';
import { UpdateConversationDto } from '../dto/update-conversation.dto';
import { ListConversationsQueryDto } from '../dto/list-conversations-query.dto';
import { SseEventEncoder } from './sse-event-encoder';

@ApiTags('AI')
@ApiBearerAuth()
@Controller('ai')
@UseGuards(PermissionsGuard)
export class AiController {
  private readonly logger = new Logger(AiController.name);
  private readonly sseEventEncoder = new SseEventEncoder();

  constructor(
    private readonly conversationService: ConversationService,
    private readonly agentService: AgentService,
    private readonly genaiService: GenaiProvider,
  ) {}

  @Post('chat/stream')
  @HttpCode(200)
  @Sse('chat/stream')
  @SkipTransform()
  @RequirePermissions(Permission.AI_CHAT)
  @ApiOperation({
    summary: 'Streaming AI chat (single SSE endpoint)',
    description:
      'Drives the full agent tool loop and streams typed SSE events ' +
      '(`tool_start`, `tool_result`, `text_chunk`, `error`, ' +
      '`done`). Lazily creates a Conversation when `conversationId` is ' +
      'omitted and snapshots the supplied `screenContext` onto it.',
  })
  @ApiBody({ type: AiChatStreamRequestDto })
  @ApiResponse({
    status: 200,
    description: 'SSE stream of typed agent events',
    content: { 'text/event-stream': {} },
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  chatStream(
    @CurrentUser() user: any,
    @Body() dto: AiChatStreamRequestDto,
    @Req() request?: Request,
  ): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      const abortController = new AbortController();
      let teardown = false;
      const abort = () => {
        teardown = true;
        if (!abortController.signal.aborted) {
          abortController.abort();
        }
      };

      request?.once?.('aborted', abort);

      const pump = async () => {
        try {
          for await (const event of this.agentService.runTurnStream(
            user.id,
            dto.conversationId ?? null,
            dto.message,
            dto.screenContext,
            abortController.signal,
          )) {
            if (teardown) break;
            subscriber.next(this.sseEventEncoder.encode(event));
          }
          subscriber.complete();
        } catch (err) {
          const error = err as Error & { code?: string };
          this.logger.error(
            `Stream error for user ${user.id}: ${error.message}`,
            (error as any)?.stack,
          );
          try {
            // Only surface the provider-mapped code to the client; a generic
            // message avoids leaking internal error detail (DB strings, stack
            // fragments) over SSE. The full message is logged server-side above.
            const isMappedAiError = Boolean(error.code);
            subscriber.next(
              this.sseEventEncoder.encode({
                type: 'error',
                code: error.code ?? 'AI_SERVICE_UNAVAILABLE',
                message: isMappedAiError
                  ? error.message || 'AI service error'
                  : 'AI service unavailable',
              }),
            );
            subscriber.complete();
          } catch {
            subscriber.error(err);
          }
        }
      };

      pump();

      return () => {
        request?.off?.('aborted', abort);
        abort();
      };
    });
  }

  @Post('chat/simple')
  @RequirePermissions(Permission.AI_CHAT)
  @ApiOperation({
    summary: 'Non-streaming chat (tooling/dev)',
    description:
      'Returns a complete AI response without streaming. Creates ' +
      'conversation if needed. Kept for local tooling and integration ' +
      'tests — production clients use POST /ai/chat/stream.',
  })
  @ApiBody({ type: AiChatRequestDto })
  @ApiResponse({ status: 201, description: 'AI chat response' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async chatSimple(@CurrentUser() user: any, @Body() dto: AiChatRequestDto) {
    const userId = user.id;
    let conversationId = dto.conversationId;

    if (!conversationId) {
      const createDto: CreateConversationDto = {
        model: 'gemini-2.0-flash',
        lessonId: dto.lessonId,
      };
      const conversation = await this.conversationService.create(
        userId,
        createDto,
      );
      conversationId = conversation.id;
    }

    const result = await this.agentService.runTurn(conversationId, dto.message);

    return { conversationId, ...result };
  }

  @Get('conversations')
  @RequirePermissions(Permission.AI_VIEW_CONVERSATIONS)
  @ApiOperation({
    summary: 'List user conversations',
    description:
      "Returns a paginated list of the current user's conversations.",
  })
  @ApiQuery({ name: 'page', required: false, example: '1' })
  @ApiQuery({ name: 'limit', required: false, example: '20' })
  @ApiQuery({ name: 'courseId', required: false })
  @ApiQuery({ name: 'lessonId', required: false })
  @ApiResponse({ status: 200, description: 'Paginated conversation list' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async listConversations(
    @CurrentUser() user: any,
    @Query() query: ListConversationsQueryDto,
  ) {
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 20;

    return this.conversationService.findByUser(user.id, page, limit, {
      courseId: query.courseId,
      lessonId: query.lessonId,
    });
  }

  @Get('conversations/:id')
  @RequirePermissions(Permission.AI_VIEW_CONVERSATIONS)
  @ApiOperation({
    summary: 'Get conversation detail',
    description:
      'Returns a conversation with its messages. Only own conversations are accessible.',
  })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({
    status: 200,
    description: 'Conversation detail with messages',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async getConversation(@CurrentUser() user: any, @Param('id') id: string) {
    const conversation = await this.conversationService.findById(id);

    if (conversation.userId !== user.id) {
      throw new ForbiddenException(
        'You do not have access to this conversation',
      );
    }

    return conversation;
  }

  @Patch('conversations/:id')
  @RequirePermissions(Permission.AI_CHAT)
  @ApiOperation({
    summary: 'Rename a conversation',
    description:
      'Updates the title of a conversation. Only own conversations can be renamed.',
  })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiBody({ type: UpdateConversationDto })
  @ApiResponse({ status: 200, description: 'Conversation renamed' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async renameConversation(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateConversationDto,
  ) {
    const conversation = await this.conversationService.findById(id);

    if (conversation.userId !== user.id) {
      throw new ForbiddenException(
        'You do not have access to this conversation',
      );
    }

    return this.conversationService.updateTitle(id, dto.title);
  }

  @Delete('conversations/:id')
  @RequirePermissions(Permission.AI_CHAT)
  @ApiOperation({
    summary: 'Delete a conversation',
    description:
      'Soft-deletes a conversation. Only own conversations can be deleted.',
  })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Conversation deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async deleteConversation(@CurrentUser() user: any, @Param('id') id: string) {
    const conversation = await this.conversationService.findById(id);

    if (conversation.userId !== user.id) {
      throw new ForbiddenException(
        'You do not have access to this conversation',
      );
    }

    await this.conversationService.softDelete(id);
  }

  @Delete('conversations/:id/messages/last-user')
  @HttpCode(204)
  @RequirePermissions(Permission.AI_CHAT)
  @ApiOperation({
    summary: 'Delete last user message',
    description:
      'Hard-deletes the most recent user message in a conversation. ' +
      'Used to roll back a failed turn so the learner can retry without ' +
      'leaving an orphaned message in the history.',
  })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({
    status: 204,
    description: 'Message deleted (or no-op if none)',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async deleteLastUserMessage(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const conversation = await this.conversationService.findById(id);

    if (conversation.userId !== user.id) {
      throw new ForbiddenException(
        'You do not have access to this conversation',
      );
    }

    await this.conversationService.deleteLastUserMessage(id);
  }

  @Delete('conversations/:id/messages/from/:messageId')
  @HttpCode(204)
  @RequirePermissions(Permission.AI_CHAT)
  @ApiOperation({
    summary: 'Delete message and all subsequent messages',
    description:
      'Hard-deletes the specified message and all messages created after it ' +
      'in the conversation. Used by the regenerate feature to roll back an ' +
      'AI response and any follow-up messages before re-sending.',
  })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiParam({ name: 'messageId', description: 'Message ID to delete from' })
  @ApiResponse({
    status: 204,
    description: 'Messages deleted (or no-op if message not found)',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async deleteMessagesFrom(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('messageId') messageId: string,
  ) {
    const conversation = await this.conversationService.findById(id);

    if (conversation.userId !== user.id) {
      throw new ForbiddenException(
        'You do not have access to this conversation',
      );
    }

    await this.conversationService.deleteMessagesFrom(id, messageId);
  }
}
